import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async create(
    @CurrentUser() user: { id: string; email: string; role: Role },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@CurrentUser() user: { id: string; email: string; role: Role }) {
    return this.ordersService.findAll(user);
  }

  @Get(':id/tracking')
  async getTracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }

  @Get('track/:id')
  async getTrackingAlias(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: Role },
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: Role },
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: Role },
  ) {
    return this.ordersService.remove(id, user);
  }
}

