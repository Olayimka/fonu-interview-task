import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('OrdersService (Integration & Unit Flow)', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockProduct = {
    id: 'prod-123',
    name: 'Wireless Keyboard',
    description: 'Mechanical keyboard',
    price: 150.0,
    stock: 10,
    createdAt: new Date(),
  };

  const mockPrisma = {
    $transaction: jest.fn(),
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create (Place Order Flow)', () => {
    it('should successfully place an order, decrement stock, and accurately calculate total price', async () => {
      const userId = 'cust-uuid-1';
      const orderDto = {
        items: [{ productId: 'prod-123', quantity: 2 }],
      };

      // Mock transaction execution to call the transaction callback
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          product: {
            findUnique: jest.fn().mockResolvedValue({ ...mockProduct, stock: 10 }),
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 8 }),
          },
          order: {
            create: jest.fn().mockImplementation(({ data, include }) => {
              return {
                id: 'order-uuid-99',
                userId: data.userId,
                totalAmount: data.totalAmount,
                status: data.status,
                items: data.items.create,
              };
            }),
          },
        };
        return callback(txMock);
      });

      const result = await service.create(userId, orderDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('order-uuid-99');
      // 2 units * $150.00 = $300.00
      expect(result.totalAmount).toBe(300.0);
      expect(result.status).toBe('COMPLETED');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId: 'prod-123',
        quantity: 2,
        priceAtPurchase: 150.0,
      });
    });

    it('should reject order and throw BadRequestException when product is out of stock', async () => {
      const userId = 'cust-uuid-1';
      const orderDto = {
        items: [{ productId: 'prod-123', quantity: 15 }], // requested 15, stock is only 10
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          product: {
            findUnique: jest.fn().mockResolvedValue({ ...mockProduct, stock: 10 }),
            update: jest.fn(),
          },
          order: {
            create: jest.fn(),
          },
        };
        return callback(txMock);
      });

      await expect(service.create(userId, orderDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(userId, orderDto)).rejects.toThrow(
        /Insufficient stock for product 'Wireless Keyboard'/,
      );
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const userId = 'cust-uuid-1';
      const orderDto = {
        items: [{ productId: 'non-existent-id', quantity: 1 }],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          product: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };
        return callback(txMock);
      });

      await expect(service.create(userId, orderDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll & findOne (Role-Based Access Control)', () => {
    it('should return all system orders when requested by an ADMIN', async () => {
      const adminUser = { id: 'admin-1', role: Role.ADMIN };
      const allOrders = [
        { id: 'order-1', userId: 'user-a', totalAmount: 100 },
        { id: 'order-2', userId: 'user-b', totalAmount: 250 },
      ];

      mockPrisma.order.findMany.mockResolvedValue(allOrders);

      const result = await service.findAll(adminUser);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.anything(),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should filter orders strictly by customer userId when requested by a CUSTOMER', async () => {
      const customerUser = { id: 'cust-uuid-1', role: Role.CUSTOMER };
      const customerOrders = [{ id: 'order-1', userId: 'cust-uuid-1', totalAmount: 100 }];

      mockPrisma.order.findMany.mockResolvedValue(customerOrders);

      const result = await service.findAll(customerUser);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'cust-uuid-1' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException if a CUSTOMER tries to view an order belonging to someone else', async () => {
      const customerUser = { id: 'cust-uuid-1', role: Role.CUSTOMER };
      const otherUserOrder = { id: 'order-999', userId: 'different-user-id' };

      mockPrisma.order.findUnique.mockResolvedValue(otherUserOrder);

      await expect(service.findOne('order-999', customerUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
