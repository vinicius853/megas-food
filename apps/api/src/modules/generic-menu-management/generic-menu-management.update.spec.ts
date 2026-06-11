import { GenericMenuManagementService } from './generic-menu-management.service';

describe('GenericMenuManagementService update', () => {
  it('executa validacao e escrita dentro da mesma transaction', async () => {
    const tx = { id: 'tx-1' };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const validator = {
      validateStructure: jest.fn(),
      validateTenantRelations: jest.fn(),
    };
    const writer = {
      write: jest.fn(async () => {
        events.push('writer');
        return {
          categories: 0,
          products: 1,
          groups: 1,
          options: 1,
          prices: 1,
          rules: 1,
        };
      }),
    };
    const events: string[] = [];
    const service = new GenericMenuManagementService(
      prisma as never,
      validator as never,
      writer as never,
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({
      categories: [],
      products: [],
    });

    await service.update('tenant-1', payload() as never);

    expect(validator.validateStructure).toHaveBeenCalledTimes(1);
    expect(validator.validateTenantRelations).toHaveBeenCalledWith(
      'tenant-1',
      expect.anything(),
      tx,
    );
    expect(writer.write).toHaveBeenCalledWith(
      tx,
      'tenant-1',
      expect.anything(),
    );
    expect(events).toEqual(['writer']);
  });

  it('propaga falha do writer e a transaction restaura o estado', async () => {
    const state = { optionName: 'Calabresa' };
    const tx = { state };
    const prisma = {
      $transaction: jest.fn(async (callback) => {
        const snapshot = { ...state };

        try {
          return await callback(tx);
        } catch (error) {
          Object.assign(state, snapshot);
          throw error;
        }
      }),
    };
    const validator = {
      validateStructure: jest.fn(),
      validateTenantRelations: jest.fn(),
    };
    const writer = {
      write: jest.fn(async () => {
        state.optionName = 'Alterado parcialmente';
        throw new Error('falha no writer');
      }),
    };
    const service = new GenericMenuManagementService(
      prisma as never,
      validator as never,
      writer as never,
    );
    const findOne = jest.spyOn(service, 'findOne');

    await expect(
      service.update('tenant-1', payload() as never),
    ).rejects.toThrow('falha no writer');

    expect(state.optionName).toBe('Calabresa');
    expect(findOne).not.toHaveBeenCalled();
  });
});

function payload() {
  return {
    categories: [],
    products: [],
  };
}
