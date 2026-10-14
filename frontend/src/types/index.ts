export type Role = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
  };
}

export interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  top_selling_product_name: string;
  top_selling_product_id?: string;
  source?: 'go-microservice' | 'database-fallback' | string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
