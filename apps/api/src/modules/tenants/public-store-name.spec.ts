import { resolvePublicStoreName } from './public-store-name';

describe('resolvePublicStoreName', () => {
  it('prioriza o nome publico configurado', () => {
    expect(
      resolvePublicStoreName({
        name: 'pizzaria teste',
        settings: {
          customization: {
            brandName: ' Demonstração Megas Food ',
          },
        },
      }),
    ).toBe('Demonstração Megas Food');
  });

  it('usa o nome do tenant quando o nome publico nao existe', () => {
    expect(
      resolvePublicStoreName({
        name: ' pizzaria teste ',
        settings: {
          customization: {
            brandName: '   ',
          },
        },
      }),
    ).toBe('pizzaria teste');
  });

  it('usa Loja como ultimo fallback', () => {
    expect(resolvePublicStoreName({ name: ' ', settings: null })).toBe('Loja');
  });
});
