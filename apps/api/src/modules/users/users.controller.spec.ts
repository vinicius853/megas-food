import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const usersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const controller = new UsersController(
    usersService as unknown as UsersService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encaminha o ator autenticado para a listagem', async () => {
    const actor = {
      userId: 'owner-1',
      tenantId: 'tenant-owner',
      role: 'CLIENT_OWNER',
    };

    await controller.findAll(actor);

    expect(usersService.findAll).toHaveBeenCalledWith(actor);
  });

  it('encaminha o ator autenticado para a busca por id', async () => {
    const actor = {
      userId: 'owner-1',
      tenantId: 'tenant-owner',
      role: 'CLIENT_OWNER',
    };

    await controller.findOne('user-2', actor);

    expect(usersService.findOne).toHaveBeenCalledWith('user-2', actor);
  });
});
