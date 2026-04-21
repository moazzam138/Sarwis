'use client';

import { useState } from 'react';
import { claimTransaction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function ClaimPage() {
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await claimTransaction(transactionId);

    if (result.success) {
      toast({
        title: 'Reward Claimed!',
        description: result.message,
      });
      setTransactionId('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine /> Claim Reward
          </CardTitle>
          <CardDescription>
            Enter the Transaction ID from the QR code to claim your reward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="txn_..."
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={isLoading}
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Claiming...' : 'Claim Reward'}
            </Button>
          </form>
           <div className="mt-4 text-center">
             <Button variant="link" asChild>
                <Link href="/">Back to Control Panel</Link>
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
