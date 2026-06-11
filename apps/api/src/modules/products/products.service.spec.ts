import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const findMany = jest.fn();
  const prisma = {
    product: {
      findMany,
    },
  };
  const service = new ProductsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it('lists tenant products without legacy pizza relations', async () => {
    await service.findAll('tenant-1', 'category-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        categoryId: 'category-1',
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });
});
