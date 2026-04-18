"use client";

import {
  Cpu,
  History,
  AlertTriangle,
  CircleDot,
  Weight,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArduinoStatus, DepositResult } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardProps {
  status: ArduinoStatus;
  lastDeposit: DepositResult | null;
  errorLog: string[];
}

export function Dashboard({ status, lastDeposit, errorLog }: DashboardProps) {
  const statusItems = [
    {
      icon: Cpu,
      label: "Arduino",
      value: status.isConnected ? "Connected" : "Disconnected",
      variant: status.isConnected ? "default" : "destructive",
    },
    {
      icon: Settings,
      label: "Status",
      value: status.machineState.replace(/_/g, " "),
      variant: "secondary",
    },
    {
      icon: CircleDot,
      label: "IR Sensor",
      value: status.irStatus,
      variant: status.irStatus === "Triggered" ? "default" : "secondary",
    },
    {
      icon: Weight,
      label: "Weight",
      value: `${status.weight} g`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Live Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{item.label}</p>
              </div>
              <Badge variant={item.variant as any}>{item.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Last Deposit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastDeposit ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono">{lastDeposit.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span>{lastDeposit.weight.toFixed(0)} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coins Earned:</span>
                <span>{lastDeposit.coinsAwarded}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No deposits recorded yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
             {errorLog.length > 0 ? (
                <div className="space-y-2 text-sm">
                    {errorLog.map((error, index) => (
                        <p key={index} className="font-mono text-destructive/80 truncate">{error}</p>
                    ))}
                </div>
             ) : (
                <p className="text-sm text-muted-foreground">No errors reported. System is healthy.</p>
             )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
