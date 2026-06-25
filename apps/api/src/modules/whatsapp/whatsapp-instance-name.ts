export function buildWhatsAppInstanceName(
  tenantId: string,
  tenantSlug?: string | null,
) {
  const identity = tenantSlug?.trim() || tenantId;
  return `megas-${identity}-${tenantId.slice(0, 8)}`;
}
