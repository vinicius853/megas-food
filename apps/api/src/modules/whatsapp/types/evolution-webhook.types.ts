type JsonRecord = Record<string, unknown>;

export type EvolutionWebhookEvent = {
  event: string;
  instanceName: string;
  apiKey?: string;
  messageId?: string;
  remoteJid?: string;
  sender?: string;
  fromMe: boolean;
  text?: string;
  connectionState?: string;
  connectedPhone?: string;
};

export function parseEvolutionWebhook(
  payload: unknown,
): EvolutionWebhookEvent | null {
  const root = readRecord(payload);
  if (!root) return null;

  const dataArray = Array.isArray(root.data)
    ? (root.data as unknown[])
    : undefined;
  const rawData = dataArray ? dataArray[0] : root.data;
  const data = readRecord(rawData) ?? {};
  const key = readRecord(data.key) ?? {};
  const message = readRecord(data.message) ?? {};

  const event = normalizeEvent(readString(root.event) ?? '');
  const instanceName =
    readString(root.instance) ??
    readString(data.instance) ??
    readString(root.instanceName) ??
    '';

  if (!event || !instanceName) return null;

  return {
    event,
    instanceName,
    apiKey: readString(root.apikey),
    messageId: readString(key.id) ?? readString(data.id),
    remoteJid: readString(key.remoteJid) ?? readString(data.remoteJid),
    sender: readString(root.sender) ?? readString(data.sender),
    fromMe: key.fromMe === true || data.fromMe === true,
    text: readMessageText(message),
    connectionState:
      readString(data.state) ??
      readString(data.status) ??
      readString(root.state),
    connectedPhone:
      readString(data.wuid) ??
      readString(data.owner) ??
      readString(root.sender),
  };
}

export function normalizeIncomingText(value?: string) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[!?.,;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeEvent(value: string) {
  return value.trim().toUpperCase().replace(/[.-]/g, '_');
}

function readMessageText(message: JsonRecord) {
  const extended = readRecord(message.extendedTextMessage);
  const image = readRecord(message.imageMessage);
  const video = readRecord(message.videoMessage);
  const buttons = readRecord(message.buttonsResponseMessage);
  const list = readRecord(message.listResponseMessage);
  const singleSelect = readRecord(list?.singleSelectReply);

  return (
    readString(message.conversation) ??
    readString(extended?.text) ??
    readString(image?.caption) ??
    readString(video?.caption) ??
    readString(buttons?.selectedDisplayText) ??
    readString(list?.title) ??
    readString(singleSelect?.selectedRowId)
  );
}

function readRecord(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
