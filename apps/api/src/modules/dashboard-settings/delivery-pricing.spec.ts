import {
  calculateZoneDeliveryPricing,
  normalizeStreetName,
} from './delivery-pricing';

describe('delivery pricing', () => {
  it('usa taxa padrao quando bairro nao tem streetRules', () => {
    const pricing = calculateZoneDeliveryPricing(
      [zone({ id: 'vista-alegre', fee: 3 })],
      {
        deliveryZoneId: 'vista-alegre',
        street: 'Rua X',
      },
    );

    expect(pricing).toEqual(
      expect.objectContaining({
        status: 'OK',
        fee: 3,
      }),
    );
  });

  it('usa taxa da rua ativa quando o nome bate', () => {
    const pricing = calculateZoneDeliveryPricing(
      [
        zone({
          id: 'vista-alegre',
          fee: 3,
          streetRules: [
            {
              id: 'rua-x',
              streetName: 'Rua X',
              fee: 5,
              isActive: true,
            },
          ],
        }),
      ],
      {
        deliveryZoneId: 'vista-alegre',
        street: 'Rua X',
      },
    );

    expect(pricing).toEqual(
      expect.objectContaining({
        status: 'OK',
        fee: 5,
        streetRuleId: 'rua-x',
      }),
    );
  });

  it('normaliza acentos, maiusculas e minusculas', () => {
    const pricing = calculateZoneDeliveryPricing(
      [
        zone({
          id: 'centro',
          fee: 7,
          streetRules: [
            {
              id: 'sao-jose',
              streetName: 'Rua Sao Jose',
              fee: 9,
              isActive: true,
            },
          ],
        }),
      ],
      {
        deliveryZoneId: 'centro',
        street: 'RUA SAO JOSE',
      },
    );

    expect(pricing).toEqual(
      expect.objectContaining({
        status: 'OK',
        fee: 9,
      }),
    );
  });

  it.each([
    ['Rua X', 'x'],
    ['R. X', 'x'],
    ['Avenida Brasil', 'brasil'],
    ['Av. Brasil', 'brasil'],
    ['Travessa Flores', 'flores'],
    ['Tv. Flores', 'flores'],
    ['Alameda Santos', 'santos'],
    ['Estrada Real', 'real'],
  ])('remove prefixo de rua %s', (input, expected) => {
    expect(normalizeStreetName(input)).toBe(expected);
  });

  it('ignora rua inativa e usa taxa padrao do bairro', () => {
    const pricing = calculateZoneDeliveryPricing(
      [
        zone({
          id: 'vista-alegre',
          fee: 3,
          streetRules: [
            {
              id: 'rua-x',
              streetName: 'Rua X',
              fee: 5,
              isActive: false,
            },
          ],
        }),
      ],
      {
        deliveryZoneId: 'vista-alegre',
        street: 'Rua X',
      },
    );

    expect(pricing).toEqual(
      expect.objectContaining({
        status: 'OK',
        fee: 3,
      }),
    );
  });

  it('mantem bairro inativo bloqueado', () => {
    const pricing = calculateZoneDeliveryPricing(
      [zone({ id: 'vista-alegre', fee: 3, isActive: false })],
      {
        deliveryZoneId: 'vista-alegre',
      },
    );

    expect(pricing).toEqual(
      expect.objectContaining({
        status: 'NO_MATCH',
      }),
    );
  });

  function zone(input: {
    id: string;
    fee: number;
    isActive?: boolean;
    streetRules?: unknown[];
  }) {
    return {
      id: input.id,
      fee: input.fee,
      eta: '30-45 min',
      isActive: input.isActive ?? true,
      streetRules: input.streetRules,
    };
  }
});
