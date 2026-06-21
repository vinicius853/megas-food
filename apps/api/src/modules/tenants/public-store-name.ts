type TenantWithPublicCustomization = {
  name?: unknown;
  settings?: unknown;
};

export function resolvePublicStoreName(
  tenant: TenantWithPublicCustomization | null | undefined,
) {
  const settings = asRecord(tenant?.settings);
  const customization = asRecord(settings.customization);

  return (
    normalizeName(customization.brandName) ||
    normalizeName(tenant?.name) ||
    'Loja'
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeName(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
