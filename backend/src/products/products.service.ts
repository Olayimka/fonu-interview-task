import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface LocalProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private localProducts: LocalProduct[] = [
    {
      id: 'prod-macbook',
      name: 'MacBook Pro M3 Max (16-inch)',
      description: 'Supercharged for pros with Apple M3 Max, 36GB unified memory, and Liquid Retina XDR display.',
      price: 3499.00,
      stock: 12,
      imageUrl: '/products/macbook.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-keyboard',
      name: 'Keychron Q1 Pro Wireless Mechanical Keyboard',
      description: 'Fully customizable 75% layout, CNC aluminum body, hot-swappable switches, and Bluetooth 5.1.',
      price: 199.99,
      stock: 24,
      imageUrl: '/products/keyboard.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-mouse',
      name: 'Logitech MX Master 3S Wireless Mouse',
      description: 'Ultra-quiet 8K DPI sensor, ergonomic sculpted silhouette, and electromagnetic MagSpeed wheel.',
      price: 99.99,
      stock: 35,
      imageUrl: '/products/mouse.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-monitor',
      name: 'Dell UltraSharp 34" Curved USB-C Hub Monitor',
      description: 'WQHD 3440x1440 curved IPS panel, 90W power delivery, RJ45 Ethernet, and factory color calibration.',
      price: 749.99,
      stock: 8,
      imageUrl: '/products/monitor.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-headphones',
      name: 'Sony WH-1000XM5 Wireless Noise-Cancelling',
      description: 'Industry-leading noise cancellation with two processors, 8 microphones, and 30-hour battery life.',
      price: 399.99,
      stock: 18,
      imageUrl: '/products/headphones.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];


  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const items = await this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (items.length > 0) return items;
      return this.localProducts;
    } catch (error) {
      this.logger.warn('PostgreSQL offline. Returning local products catalog');
      return this.localProducts;
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (product) return product;
    } catch (error) {
      this.logger.warn(`PostgreSQL query failed. Checking local products for ID: ${id}`);
    }

    const localProd = this.localProducts.find((p) => p.id === id);
    if (!localProd) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return localProd;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: dto.stock,
        },
      });
    } catch (error) {
      const newProd: LocalProduct = {
        id: `local-prod-${Date.now()}`,
        name: dto.name,
        description: dto.description || '',
        price: dto.price,
        stock: dto.stock,
        imageUrl: dto.imageUrl || '/products/macbook.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.localProducts.unshift(newProd);
      return newProd;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      await this.findOne(id);
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
        },
      });
    } catch (error) {
      const prodIndex = this.localProducts.findIndex((p) => p.id === id);
      if (prodIndex === -1) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      this.localProducts[prodIndex] = {
        ...this.localProducts[prodIndex],
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        updatedAt: new Date(),
      };
      return this.localProducts[prodIndex];
    }
  }


  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete product because it is referenced by existing customer orders. Consider setting its stock to 0 instead.',
        );
      }
      const prodIndex = this.localProducts.findIndex((p) => p.id === id);
      if (prodIndex !== -1) {
        const removed = this.localProducts.splice(prodIndex, 1)[0];
        return removed;
      }
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
  }
}

