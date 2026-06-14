export type EvolutionInstance = {
  instanceName: string;
  status?: string;
  owner?: string;
};

export type EvolutionConnectionState = {
  state: string;
  connectedPhone?: string;
};

export type EvolutionQrCode = {
  qrCodeBase64?: string;
  qrCode?: string;
};

export type EvolutionInstanceProvisionResult = {
  instance: EvolutionInstance;
  qrCode: EvolutionQrCode;
};

export type WhatsAppQrResponse = {
  status: 'QR_PENDING' | 'CONNECTED' | 'ERROR';
  qrCodeBase64?: string;
  qrCode?: string;
  instanceName: string;
  connectedPhone?: string;
  message?: string;
};
