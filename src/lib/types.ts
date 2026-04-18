export type DepositStep =
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING_FOR_WASTE'
  | 'WASTE_DETECTED'
  | 'OPENING_LID'
  | 'WAITING_FOR_DEPOSIT'
  | 'WEIGHT_DETECTED'
  | 'CLOSING_LID'
  | 'DEPOSIT_SUCCESSFUL'
  | 'GENERATING_QR'
  | 'SHOW_QR'
  | 'ERROR'
  | 'TIMEOUT';

export type QrData = {
  qrCode: string; // base64 image
  transactionId: string;
  coinsAwarded: number;
};

export type EnvironmentalInsight = {
  insight: string;
};

export type DepositResult = QrData & EnvironmentalInsight & {
    weight: number;
};

export type ArduinoStatus = {
  isConnected: boolean;
  irStatus: 'Ready' | 'Triggered';
  weight: number;
};
