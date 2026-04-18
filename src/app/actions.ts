'use server';

import { generateEnvironmentalInsight } from '@/ai/flows/generate-environmental-insight';
import type { DepositResult } from '@/lib/types';

export async function processDeposit(weight: number): Promise<DepositResult> {
  console.log(`Processing deposit for weight: ${weight}`);

  try {
    // In a real application, you would fetch from your backend API:
    // const API_BASE_URL = 'https://your-backend-api.com/api';
    // const qrResponse = await fetch(`${API_BASE_URL}/qr/generate`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     weight,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
    // if (!qrResponse.ok) throw new Error(`API Error: ${qrResponse.statusText}`);
    // const qrData = await qrResponse.json();

    // MOCKING API RESPONSE FOR DEVELOPMENT
    const qrData = {
      // A sample base64 encoded QR code for the transaction details
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAABBUlEQVR42u3WMQ7DIAwEULsT8x9UJSA9eHcTCRdUIJzJ7GxcWw4HDgU+9udPj8cDAAAAAACA/4D3lB6iMwlDqSmG0kGkQ+pA5UQd1D5mRKkEVQ5pxDRyCtE5pA/qYCaSHpQ+pBqyiOmR+pLqSZdQz0Z6U7qE6kceU2+kLpL9pC6kfkl9Y+Zf0hgyh+wh9SPbQ/pOOgAAAAD4C4PXgfe35pPpx32s/OR6zM833pT6xWfWf/qT+nF/aj+Z3mH/6s/0Y/1T/1n/6W8/0kZ6kfSj9JP0Y/VT/Zn/af7k/pMFAAAAAPi3PwGg/Qe3nF2/SAAAAABJRU5ErkJggg==`,
      transactionId: `txn_${Math.random().toString(36).substring(2, 9)}`,
      coinsAwarded: Math.floor(weight / 10), // Example: 1 coin per 10 grams
    };

    const insightData = await generateEnvironmentalInsight({});

    return {
      ...qrData,
      weight,
      insight: insightData.insight,
    };
  } catch (error) {
    console.error('Error processing deposit:', error);
    // Return a structured error response
    return {
      qrCode: '',
      transactionId: 'ERROR',
      coinsAwarded: 0,
      weight: weight,
      insight:
        'Could not generate an insight at this time. But every piece of recycled waste helps our planet!',
    };
  }
}
