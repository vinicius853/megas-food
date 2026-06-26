export type DeliveryStreetRuleSetting = {
  id?: unknown;
  streetName?: unknown;
  fee?: unknown;
  eta?: unknown;
  isActive?: unknown;
};

export type DeliveryZoneSetting = {
  id?: unknown;
  fee?: unknown;
  isActive?: unknown;
  streetRules?: unknown;
};

export type DeliveryPricingInput = {
  deliveryZoneId?: string;
  street?: string;
};

export type ZoneDeliveryPricingResult =
  | {
      status: 'OK';
      fee: number;
      zoneId: string;
      streetRuleId?: string;
      eta?: string;
    }
  | {
      status: 'NO_MATCH' | 'INVALID_CONFIG';
      fee: 0;
      reason: string;
    };

export function calculateZoneDeliveryPricing(
  zones: DeliveryZoneSetting[] | undefined,
  input: DeliveryPricingInput,
): ZoneDeliveryPricingResult {
  const activeZones = getActiveDeliveryZones(zones);

  if (activeZones.length === 0) {
    if (input.deliveryZoneId) {
      return {
        status: 'NO_MATCH',
        fee: 0,
        reason: 'Zona de entrega inexistente ou inativa.',
      };
    }

    return {
      status: 'OK',
      fee: 0,
      zoneId: '',
    };
  }

  if (!input.deliveryZoneId) {
    return {
      status: 'NO_MATCH',
      fee: 0,
      reason: 'Selecione uma zona de entrega valida.',
    };
  }

  const selectedZone = activeZones.find(
    (zone) => zone.id === input.deliveryZoneId,
  );

  if (!selectedZone) {
    return {
      status: 'NO_MATCH',
      fee: 0,
      reason: 'Zona de entrega inexistente ou inativa.',
    };
  }

  const streetRule = findMatchingStreetRule(
    selectedZone.streetRules,
    input.street,
  );

  if (streetRule) {
    const streetFee = Number(streetRule.fee);

    if (!Number.isFinite(streetFee) || streetFee < 0) {
      return {
        status: 'INVALID_CONFIG',
        fee: 0,
        reason: 'A regra de rua possui uma taxa invalida.',
      };
    }

    return {
      status: 'OK',
      fee: streetFee,
      zoneId: selectedZone.id,
      streetRuleId: streetRule.id,
      eta: streetRule.eta,
    };
  }

  const fee = Number(selectedZone.fee);

  if (!Number.isFinite(fee) || fee < 0) {
    return {
      status: 'INVALID_CONFIG',
      fee: 0,
      reason: 'A zona de entrega possui uma taxa invalida.',
    };
  }

  return {
    status: 'OK',
    fee,
    zoneId: selectedZone.id,
  };
}

export function normalizeStreetName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^(rua|r|avenida|av|travessa|tv|alameda|estrada)\s+/, '')
    .trim();
}

function getActiveDeliveryZones(zones: DeliveryZoneSetting[] | undefined) {
  return (zones ?? []).flatMap((zone) => {
    if (
      !isRecord(zone) ||
      zone.isActive !== true ||
      typeof zone.id !== 'string'
    ) {
      return [];
    }

    return [
      {
        id: zone.id,
        fee: zone.fee,
        streetRules: Array.isArray(zone.streetRules) ? zone.streetRules : [],
      },
    ];
  });
}

function findMatchingStreetRule(
  rules: unknown[],
  street: string | undefined,
) {
  const normalizedStreet = normalizeStreetName(String(street ?? ''));

  if (!normalizedStreet) {
    return null;
  }

  return (
    rules.flatMap((rule) => {
      if (
        !isRecord(rule) ||
        rule.isActive !== true ||
        typeof rule.streetName !== 'string'
      ) {
        return [];
      }

      const normalizedRule = normalizeStreetName(rule.streetName);

      if (!normalizedRule || normalizedRule !== normalizedStreet) {
        return [];
      }

      return [
        {
          id: typeof rule.id === 'string' ? rule.id : undefined,
          fee: rule.fee,
          eta: typeof rule.eta === 'string' ? rule.eta : undefined,
        },
      ];
    })[0] ?? null
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
