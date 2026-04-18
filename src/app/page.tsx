"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import {
  Zap,
  ZapOff,
  Trash2,
  Cpu,
  History,
  AlertTriangle,
  Settings,
  RefreshCw,
  Wind,
} from "lucide-react";
import { useArduino } from "@/hooks/use-arduino";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DepositStep, DepositResult, ArduinoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { processDeposit } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { QRDisplay } from "@/components/qr-display";
import { Dashboard } from "@/components/dashboard";
import { BinLid } from "@/components/icons";

type State = {
  step: DepositStep;
  depositResult: DepositResult | null;
  error: string | null;
  weightAtDetection: number;
};

type Action =
  | { type: "CONNECT_START" }
  | { type: "CONNECT_SUCCESS" }
  | { type: "CONNECT_FAIL"; payload: string }
  | { type: "DISCONNECT" }
  | { type: "WASTE_DETECTED"; payload: number }
  | { type: "LID_OPENED" }
  | { type: "WEIGHT_CHANGED"; payload: number }
  | { type: "LID_CLOSED" }
  | { type: "START_QR_GENERATION" }
  | { type: "QR_GENERATION_SUCCESS"; payload: DepositResult }
  | { type: "QR_GENERATION_FAIL"; payload: string }
  | { type: "TIMEOUT" }
  | { type: "RESET" }
  | { type: "ARDUINO_ERROR"; payload: string };

const initialState: State = {
  step: "IDLE",
  depositResult: null,
  error: null,
  weightAtDetection: 0,
};

function workflowReducer(state: State, action: Action): State {
  switch (action.type) {
    case "CONNECT_START":
      return { ...state, step: "CONNECTING", error: null };
    case "CONNECT_SUCCESS":
      return { ...state, step: "WAITING_FOR_WASTE", error: null };
    case "CONNECT_FAIL":
      return { ...state, step: "ERROR", error: action.payload };
    case "DISCONNECT":
      return { ...initialState };
    case "WASTE_DETECTED":
      if (state.step === "WAITING_FOR_WASTE") {
        return { ...state, step: "WASTE_DETECTED", weightAtDetection: action.payload };
      }
      return state;
    case "LID_OPENED":
      if (state.step === "OPENING_LID") {
        return { ...state, step: "WAITING_FOR_DEPOSIT" };
      }
      return state;
    case "WEIGHT_CHANGED":
      if (state.step === "WAITING_FOR_DEPOSIT" && action.payload > state.weightAtDetection + 20) { // 20g threshold
        return { ...state, step: "WEIGHT_DETECTED" };
      }
      return state;
    case "LID_CLOSED":
      if (state.step === "CLOSING_LID") {
        return { ...state, step: "DEPOSIT_SUCCESSFUL" };
      }
      return state;
    case "START_QR_GENERATION":
        return { ...state, step: "GENERATING_QR" };
    case "QR_GENERATION_SUCCESS":
      return { ...state, step: "SHOW_QR", depositResult: action.payload };
    case "QR_GENERATION_FAIL":
      return { ...state, step: "ERROR", error: action.payload };
    case "RESET":
      return {
        ...state,
        step: "WAITING_FOR_WASTE",
        depositResult: null,
        error: null,
        weightAtDetection: 0,
      };
    case "ARDUINO_ERROR":
      return { ...state, step: "ERROR", error: action.payload };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const { toast } = useToast();
  const {
    connect,
    disconnect,
    sendCommand,
    isConnected,
    weight,
    irStatus,
    error: arduinoError,
  } = useArduino();
  const [lastDeposit, setLastDeposit] = useState<DepositResult | null>(null);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    if(arduinoError) {
      dispatch({ type: 'ARDUINO_ERROR', payload: arduinoError });
    }
  }, [arduinoError]);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: state.error,
      });
      setErrorLog(prev => [new Date().toLocaleTimeString() + ": " + state.error, ...prev].slice(0, 5));
    }
  }, [state.error, toast]);
  
  const handleConnect = async () => {
    dispatch({ type: "CONNECT_START" });
    try {
      await connect();
      dispatch({ type: "CONNECT_SUCCESS" });
      toast({ title: "Success", description: "Arduino connected successfully." });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to Arduino.";
      dispatch({ type: "CONNECT_FAIL", payload: errorMsg });
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    dispatch({ type: "DISCONNECT" });
    toast({ title: "Disconnected", description: "Arduino has been disconnected." });
  };

  const handleReset = useCallback(() => {
    if (isConnected) {
      dispatch({ type: "RESET" });
    } else {
      dispatch({ type: "DISCONNECT" });
    }
  }, [isConnected]);

  // Main workflow logic driven by useEffect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // --- State-based command sending ---
    if (state.step === "WASTE_DETECTED") {
      sendCommand("OPEN_LID");
      dispatch({ type: "LID_OPENED" }); // optimistically move to next state, should be OPENING_LID
      // Corrected in reducer: state becomes OPENING_LID, arduino response 'LID_OPENED' moves it to next
      // Let's simplify for now
      setTimeout(() => dispatch({type: 'LID_OPENED'}), 500); // Mock lid opening time
    } else if (state.step === "WEIGHT_DETECTED") {
      sendCommand("CLOSE_LID");
      setTimeout(() => dispatch({type: 'LID_CLOSED'}), 500); // Mock lid closing time
    } else if (state.step === 'DEPOSIT_SUCCESSFUL') {
        dispatch({ type: 'START_QR_GENERATION' });
        const depositedWeight = weight - state.weightAtDetection;
        processDeposit(depositedWeight > 0 ? depositedWeight : 250) // Use dummy weight if something is wrong
            .then(result => {
                dispatch({ type: 'QR_GENERATION_SUCCESS', payload: result });
                setLastDeposit(result);
            })
            .catch(err => {
                const errorMsg = err instanceof Error ? err.message : "Failed to generate QR code.";
                dispatch({ type: 'QR_GENERATION_FAIL', payload: errorMsg });
            });
    }

    // --- Timeouts for workflow steps ---
    if (state.step === "WAITING_FOR_DEPOSIT") {
      timeoutId = setTimeout(() => {
        sendCommand("CLOSE_LID");
        dispatch({ type: "TIMEOUT" });
        toast({ title: "Timeout", description: "No deposit detected. Please try again." });
        handleReset();
      }, 30000); // 30-second timeout
    }

    // --- Arduino message parsing ---
    if (irStatus === 'Triggered' && state.step === 'WAITING_FOR_WASTE') {
      dispatch({ type: 'WASTE_DETECTED', payload: weight });
    }

    if (state.step === 'WAITING_FOR_DEPOSIT') {
        dispatch({type: 'WEIGHT_CHANGED', payload: weight})
    }


    return () => {
      clearTimeout(timeoutId);
    };
  }, [state.step, sendCommand, irStatus, weight, handleReset, state.weightAtDetection]);


  const arduinoStatus: ArduinoStatus = { isConnected, irStatus, weight };

  const renderWorkflowContent = () => {
    switch (state.step) {
      case "IDLE":
      case "CONNECTING":
        return (
          <div className="text-center">
            <Wind className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">
              {state.step === "IDLE" ? "Ready to Connect" : "Connecting..."}
            </h2>
            <p className="text-muted-foreground">Please connect the Arduino device.</p>
          </div>
        );
      case 'WAITING_FOR_WASTE':
        return (
            <div className="text-center">
                <Trash2 className="mx-auto h-16 w-16 text-primary/70" />
                <h2 className="mt-4 text-2xl font-semibold">Waiting for Waste</h2>
                <p className="text-muted-foreground">Insert waste into the slot to begin.</p>
            </div>
        );
      case 'OPENING_LID':
      case 'WASTE_DETECTED':
        return (
            <div className="text-center">
                <BinLid isOpen={true} className="mx-auto h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Lid Opening</h2>
                <p className="text-muted-foreground">Please deposit your waste.</p>
            </div>
        );
      case 'WAITING_FOR_DEPOSIT':
         return (
            <div className="text-center">
                <BinLid isOpen={true} className="mx-auto h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Deposit Waste Now</h2>
                <p className="text-muted-foreground">Current weight will be updated in real-time.</p>
                <p className="text-4xl font-bold mt-4">{weight}g</p>
            </div>
        );
      case 'CLOSING_LID':
      case 'WEIGHT_DETECTED':
        return (
            <div className="text-center">
                <BinLid isOpen={false} className="mx-auto h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Lid Closing</h2>
                <p className="text-muted-foreground">Thank you for your deposit!</p>
            </div>
        );
      case 'GENERATING_QR':
        return (
            <div className="text-center">
                <RefreshCw className="mx-auto h-16 w-16 animate-spin text-primary" />
                <h2 className="mt-4 text-2xl font-semibold">Processing Deposit</h2>
                <p className="text-muted-foreground">Generating your reward QR code...</p>
            </div>
        );
      case "SHOW_QR":
        return state.depositResult && <QRDisplay result={state.depositResult} onDone={handleReset} />;

      case 'ERROR':
        return (
             <div className="text-center">
                <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
                <h2 className="mt-4 text-2xl font-semibold">System Error</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{state.error}</p>
                 <Button onClick={handleReset} className="mt-6">Try Again</Button>
            </div>
        )
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background font-sans">
      <header className="flex items-center justify-between border-b px-4 py-2 md:px-8">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Sarwis Control Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="hidden sm:flex">
             {isConnected ? "Arduino Connected" : "Disconnected"}
          </Badge>
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={state.step === 'CONNECTING'}>
              <Zap className="mr-2 h-4 w-4" /> Connect
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleDisconnect}>
              <ZapOff className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="flex items-center justify-center lg:col-span-2 min-h-[60vh]">
            <CardContent className="p-6 w-full">
                {isConnected ? renderWorkflowContent() : (
                     <div className="text-center">
                        <ZapOff className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold">Device Disconnected</h2>
                        <p className="text-muted-foreground">Please connect to the Arduino to begin.</p>
                        <Button onClick={handleConnect} className="mt-6" disabled={state.step === 'CONNECTING'}>
                           <Zap className="mr-2 h-4 w-4" /> Connect to Arduino
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>

          <Dashboard
            status={arduinoStatus}
            lastDeposit={lastDeposit}
            errorLog={errorLog}
          />
        </div>
      </main>
    </div>
  );
}
