"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, Clock, Coins, Leaf, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DepositResult } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface QRDisplayProps {
  result: DepositResult;
  onDone: () => void;
}

const COUNTDOWN_SECONDS = 30;

export function QRDisplay({ result, onDone }: QRDisplayProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onDone]);

  const { qrCode, transactionId, coinsAwarded, weight, insight } = result;

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-3xl font-bold">Deposit Successful!</h2>
        <h3 className="text-xl text-muted-foreground">
          Scan to Claim Reward
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="flex flex-col items-center justify-center p-6 bg-card/50">
           {qrCode ? (
            <Image
              src={qrCode}
              alt="QR Code"
              width={250}
              height={250}
              className="rounded-lg shadow-lg"
            />
           ): (
            <div className="w-[250px] h-[250px] flex items-center justify-center bg-muted rounded-lg">
                <p className="text-destructive">QR Error</p>
            </div>
           )}
        </Card>

        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                     <div className="flex justify-between items-center text-lg">
                        <div className="flex items-center gap-2 text-muted-foreground"><Coins className="h-5 w-5"/> Coins Awarded</div>
                        <span className="font-bold text-primary">{coinsAwarded}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <div className="flex items-center gap-2 text-muted-foreground"><Weight className="h-5 w-5"/> Weight</div>
                        <span className="font-bold">{weight.toFixed(0)} g</span>
                    </div>
                     <p className="text-xs text-muted-foreground text-center pt-2">ID: {transactionId}</p>
                </CardContent>
            </Card>

            <Card className="bg-accent/20 border-accent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-accent-foreground/80">
                        <Leaf className="h-5 w-5" />
                        Eco-Tip
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-accent-foreground/90">{insight}</p>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
            <span>Resetting automatically...</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {countdown}s</span>
        </div>
        <Progress value={(countdown / COUNTDOWN_SECONDS) * 100} className="h-2" />
        <Button onClick={onDone} variant="outline" className="w-full">
          Start New Deposit
        </Button>
      </div>
    </div>
  );
}
