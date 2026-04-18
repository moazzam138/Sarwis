"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import {
  Zap,
  ZapOff,
  Trash2,
  AlertTriangle,
  Settings,
  RefreshCw,
  Wind,
  Loader,
} from "lucide-react";
import { useArduino } from "@/hooks/use-arduino";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DepositStep, DepositResult, ArduinoStatus } from "@/lib/types";
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
  irStatus: "Ready" | "Triggered";
};

type Action =
  | { type: "SET_STEP"; payload: DepositStep }
  | { type: "CONNECT_START" }
  | { type: "CONNECT_SUCCESS" }
  | { type: "CONNECT_FAIL"; payload: string }
  | { type: "DISCONNECT" }
  | { type: "ARDUINO_EVENT"; payload: { event: string; weight: number } }
  | { type: "WEIGHT_CHANGE"; payload: number }
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
  irStatus: "Ready",
};

function workflowReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "CONNECT_START":
      return { ...state, step: "CONNECTING", error: null };
    case "CONNECT_SUCCESS":
      return { ...state, step: "WAITING_FOR_WASTE", error: null };
    case "CONNECT_FAIL":
      return { ...state, step: "ERROR", error: action.payload };
    case "DISCONNECT":
      return { ...initialState };
    case "ARDUINO_EVENT":
      switch (state.step) {
        case "WAITING_FOR_WASTE":
          if (action.payload.event === "WASTE_DETECTED") {
            return {
              ...state,
              step: "WASTE_DETECTED",
              irStatus: "Triggered",
              weightAtDetection: action.payload.weight,
            };
          }
          break;
        case "OPENING_LID":
          if (action.payload.event === "LID_OPENED") {
            return { ...state, step: "WAITING_FOR_DEPOSIT" };
          }
          break;
        case "CLOSING_LID":
          if (action.payload.event === "LID_CLOSED") {
            return { ...state, step: "GENERATING_QR" };
          }
          break;
      }
      return state;
    case "WEIGHT_CHANGE":
      if (
        state.step === "WAITING_FOR_DEPOSIT" &&
        action.payload > state.weightAtDetection + 20
      ) {
        return { ...state, step: "DEPOSIT_DETECTED" };
      }
      return state;
    case "QR_GENERATION_SUCCESS":
      return { ...state, step: "SHOW_QR", depositResult: action.payload };
    case "QR_GENERATION_FAIL":
      return { ...state, step: "ERROR", error: action.payload };
    case "TIMEOUT":
      return { ...state, step: "ERROR", error: "No deposit detected in time. Please try again." };
    case "RESET":
      return { ...initialState, step: "WAITING_FOR_WASTE" };
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
    error: arduinoError,
    lastArduinoEvent,
    clearLastArduinoEvent,
  } = useArduino();
  const [lastDeposit, setLastDeposit] = useState<DepositResult | null>(null);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    if (arduinoError) {
      dispatch({ type: "ARDUINO_ERROR", payload: arduinoError });
    }
  }, [arduinoError]);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: state.error,
      });
      setErrorLog((prev) =>
        [new Date().toLocaleTimeString() + ": " + state.error, ...prev].slice(0, 5)
      );
    }
  }, [state.error, toast]);

  const handleConnect = async () => {
    dispatch({ type: "CONNECT_START" });
    try {
      await connect();
      dispatch({ type: "CONNECT_SUCCESS" });
      toast({ title: "Success", description: "Arduino connected successfully." });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to connect to Arduino.";
      dispatch({ type: "CONNECT_FAIL", payload: errorMsg });
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    dispatch({ type: "DISCONNECT" });
    toast({
      title: "Disconnected",
      description: "Arduino has been disconnected.",
    });
  };

  const handleReset = useCallback(() => {
    if (isConnected) {
      dispatch({ type: "RESET" });
    } else {
      dispatch({ type: "DISCONNECT" });
    }
  }, [isConnected]);

  // Main workflow logic driven by useEffect for state changes and events
  useEffect(() => {
    // --- Arduino Event Handler ---
    if (lastArduinoEvent) {
      dispatch({ type: "ARDUINO_EVENT", payload: { event: lastArduinoEvent, weight } });
      clearLastArduinoEvent();
    }

    // --- State-based command sending ---
    if (state.step === "WASTE_DETECTED") {
      sendCommand("OPEN_LID");
      dispatch({ type: "SET_STEP", payload: "OPENING_LID" });
    } else if (state.step === "DEPOSIT_DETECTED") {
      sendCommand("CLOSE_LID");
      dispatch({ type: "SET_STEP", payload: "CLOSING_LID" });
    } else if (state.step === "GENERATING_QR") {
      const depositedWeight = weight - state.weightAtDetection;
      processDeposit(depositedWeight > 20 ? depositedWeight : 250) // Use dummy weight if something is wrong
        .then((result) => {
          dispatch({ type: "QR_GENERATION_SUCCESS", payload: result });
          setLastDeposit(result);
        })
        .catch((err) => {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to generate QR code.";
          dispatch({ type: "QR_GENERATION_FAIL", payload: errorMsg });
        });
    }

    // --- Handle weight changes for deposit detection ---
    if (state.step === "WAITING_FOR_DEPOSIT") {
      dispatch({ type: "WEIGHT_CHANGE", payload: weight });
    }
  }, [
    state.step,
    lastArduinoEvent,
    weight,
    sendCommand,
    clearLastArduinoEvent,
    state.weightAtDetection,
  ]);

  // --- Timeout for deposit step ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (state.step === "WAITING_FOR_DEPOSIT") {
      timeoutId = setTimeout(() => {
        sendCommand("CLOSE_LID");
        dispatch({ type: "TIMEOUT" });
      }, 30000); // 30-second timeout
    }
    return () => clearTimeout(timeoutId);
  }, [state.step, sendCommand]);


  const arduinoStatus: ArduinoStatus = {
    isConnected,
    irStatus: state.irStatus,
    weight,
    machineState: state.step,
  };

  const renderWorkflowContent = () => {
    switch (state.step) {
      case "IDLE":
      case "CONNECTING":
        return (
          <div className="text-center">
            <Wind className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">
              {state.step === "IDLE" ? "Device Disconnected" : "Connecting..."}
            </h2>
            <p className="text-muted-foreground">
              {state.step === "IDLE" ? "Please connect to Arduino to begin." : "Attempting to connect to the device..."}
            </p>
          </div>
        );
      case "WAITING_FOR_WASTE":
        return (
          <div className="text-center">
            <Trash2 className="mx-auto h-16 w-16 text-primary/70" />
            <h2 className="mt-4 text-2xl font-semibold">Waiting for Waste</h2>
            <p className="text-muted-foreground">
              Insert waste into the slot to begin.
            </p>
          </div>
        );
      case "WASTE_DETECTED":
        return (
          <div className="text-center">
            <Loader className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">Waste Detected</h2>
            <p className="text-muted-foreground">Opening lid for deposit.</p>
          </div>
        );
      case "OPENING_LID":
         return (
            <div className="text-center">
                <BinLid isOpen={true} className="mx-auto h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Opening Lid</h2>
                <p className="text-muted-foreground">Please deposit your waste.</p>
            </div>
        );
      case "WAITING_FOR_DEPOSIT":
        return (
          <div className="text-center">
            <BinLid isOpen={true} className="mx-auto h-16 w-16" />
            <h2 className="mt-4 text-2xl font-semibold">Deposit Waste Now</h2>
            <p className="text-muted-foreground">
              Real-time weight is shown below.
            </p>
            <p className="text-4xl font-bold mt-4">{weight}g</p>
          </div>
        );
      case "DEPOSIT_DETECTED":
        return (
            <div className="text-center">
                <BinLid isOpen={true} className="mx-auto h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Deposit Detected</h2>
                <p className="text-muted-foreground">Waste successfully deposited.</p>
                <p className="text-4xl font-bold mt-4">{(weight - state.weightAtDetection).toFixed(0)}g</p>
            </div>
        );
      case "CLOSING_LID":
        return (
          <div className="text-center">
            <BinLid isOpen={false} className="mx-auto h-16 w-16" />
            <h2 className="mt-4 text-2xl font-semibold">Closing Lid</h2>
            <p className="text-muted-foreground">Processing deposit. Thank you!</p>
          </div>
        );
      case "GENERATING_QR":
        return (
          <div className="text-center">
            <RefreshCw className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">Generating QR</h2>
            <p className="text-muted-foreground">
              Generating your reward QR code...
            </p>
          </div>
        );
      case "SHOW_QR":
        return (
          state.depositResult && (
            <QRDisplay result={state.depositResult} onDone={handleReset} />
          )
        );
      case "ERROR":
      case "TIMEOUT":
        return (
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
            <h2 className="mt-4 text-2xl font-semibold">System Error</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {state.error}
            </p>
            <Button onClick={handleReset} className="mt-6">
              Try Again
            </Button>
          </div>
        );
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
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="hidden sm:flex"
          >
            {isConnected ? "Arduino Connected" : "Disconnected"}
          </Badge>
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={state.step === "CONNECTING"}
            >
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
              {isConnected ? (
                renderWorkflowContent()
              ) : (
                <div className="text-center">
                  <ZapOff className="mx-auto h-16 w-16 text-muted-foreground" />
                  <h2 className="mt-4 text-2xl font-semibold">
                    Device Disconnected
                  </h2>
                  <p className="text-muted-foreground">
                    Please connect to the Arduino to begin.
                  </p>
                  <Button
                    onClick={handleConnect}
                    className="mt-6"
                    disabled={state.step === "CONNECTING"}
                  >
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
