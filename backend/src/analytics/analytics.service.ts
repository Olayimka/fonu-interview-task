import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  top_selling_product_name: string;
  source: 'go-microservice' | 'database-fallback';
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getAdminAnalytics(): Promise<AnalyticsSummary> {
    const reportingUrl =
      this.configService.get<string>('REPORTING_SERVICE_URL') || 'http://localhost:8080';

    try {
      this.logger.log(`Dispatching analytics query to Go microservice at: ${reportingUrl}/admin/analytics`);
      const response = await firstValueFrom(
        this.httpService.get(`${reportingUrl}/admin/analytics`).pipe(
          timeout(3000),
          catchError((err) => {
            this.logger.warn(
              `Go reporting microservice unavailable (${err.message}). Using database fallback.`,
            );
            return of(null);
          }),
        ),
      );

      if (response && response.data) {
        return {
          total_revenue: Number(response.data.total_revenue || 0),
          total_orders: Number(response.data.total_orders || 0),
          top_selling_product_name: String(response.data.top_selling_product_name || 'N/A'),
          source: 'go-microservice',
        };
      }
    } catch (err: any) {
      this.logger.warn(`Error connecting to Go microservice: ${err.message}. Using fallback.`);
    }

    // High-performance fallback if Go service is booting up
    return this.getFallbackAnalytics();
  }

  private async getFallbackAnalytics(): Promise<AnalyticsSummary> {
    const [revenueAggregation, orderCount, topProductItems] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.order.count(),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 1,
      }),
    ]);

    let topSellingProductName = 'N/A';
    if (topProductItems.length > 0 && topProductItems[0].productId) {
      const topProd = await this.prisma.product.findUnique({
        where: { id: topProductItems[0].productId },
      });
      if (topProd) {
        topSellingProductName = topProd.name;
      }
    }

    return {
      total_revenue: Number(revenueAggregation._sum.totalAmount || 0),
      total_orders: orderCount,
      top_selling_product_name: topSellingProductName,
      source: 'database-fallback',
    };
  }
}
