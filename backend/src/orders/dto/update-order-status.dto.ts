import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Order status is required' })
  @IsIn(ORDER_STATUSES, {
    message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
  })
  status: OrderStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
