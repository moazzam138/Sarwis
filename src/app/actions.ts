'use server';

import { generateEnvironmentalInsight } from '@/ai/flows/generate-environmental-insight';
import type { DepositResult } from '@/lib/types';
import QRCode from 'qrcode';
import { db } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

async function generateQrDataUrl(payload: object): Promise<string> {
  try {
    const jsonString = JSON.stringify(payload);
    return await QRCode.toDataURL(jsonString);
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

export async function processDeposit(weight: number): Promise<DepositResult> {
  console.log(`Processing deposit for weight: ${weight}`);

  try {
    const transactionId = `txn_${Math.random().toString(36).substring(2, 9)}`;
    const coinsAwarded = Math.floor(weight / 10);
    const timestamp = new Date().toISOString();

    const qrPayload = {
      system: 'SARWIS',
      transactionId,
      coins: coinsAwarded,
      weight,
      timestamp,
    };

    try {
      await addDoc(collection(db, 'sarwis_transactions'), {
        transactionId: transactionId,
        coins: coinsAwarded,
        weight: weight,
        timestamp: serverTimestamp(),
        machineId: 'SARWIS-001',
        status: 'unused',
      });
    } catch (e) {
      console.error('Firestore save error:', e);
      // Non-blocking, log and continue
    }

    const qrCode = await generateQrDataUrl(qrPayload);

    const qrData = {
      qrCode,
      transactionId,
      coinsAwarded,
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


export async function generateTestQr(): Promise<DepositResult> {
  console.log(`Processing test QR generation`);

  try {
    const testWeight = 50;
    const testCoins = 5;
    const transactionId = `SARWIS_TXN_${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const qrPayload = {
      system: "SARWIS",
      transactionId: transactionId,
      coins: testCoins,
      weight: testWeight,
      timestamp: timestamp
    };

    try {
      await addDoc(collection(db, 'sarwis_transactions'), {
        transactionId: transactionId,
        coins: testCoins,
        weight: testWeight,
        timestamp: serverTimestamp(),
        machineId: 'SARWIS-001-TEST',
        status: 'unused',
      });
    } catch (e) {
      console.error('Firestore save error:', e);
      // Non-blocking, log and continue
    }

    const qrCode = await generateQrDataUrl(qrPayload);

    const qrData = {
      qrCode: qrCode,
      transactionId: transactionId,
      coinsAwarded: testCoins,
    };

    const insightData = await generateEnvironmentalInsight({});

    return {
      ...qrData,
      weight: testWeight,
      insight: insightData.insight,
    };
  } catch (error) {
    console.error('Error generating test QR:', error);
    // Return a structured error response
    return {
      qrCode: '',
      transactionId: 'ERROR',
      coinsAwarded: 0,
      weight: 50,
      insight:
        'Could not generate an insight at this time. But every piece of recycled waste helps our planet!',
    };
  }
}
