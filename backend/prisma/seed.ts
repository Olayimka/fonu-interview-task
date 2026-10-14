import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash default password
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const customerPassword = await bcrypt.hash('customer123', saltRounds);

  // 1. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fonu.com' },
    update: {},
    create: {
      email: 'admin@fonu.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // 2. Upsert Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@fonu.com' },
    update: {},
    create: {
      email: 'customer@fonu.com',
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  console.log(`👤 Customer created: ${customer.email}`);

  // 3. Upsert Sample Products
  const productsData = [
    {
      name: 'MacBook Pro 16" M3 Max',
      description: 'Apple M3 Max chip with 16-core CPU and 40-core GPU, 36GB Unified Memory, 1TB SSD.',
      price: 3499.00,
      stock: 15,
    },
    {
      name: 'Keychron Q1 Pro Wireless Keyboard',
      description: 'Custom mechanical keyboard with QMK/VIA support, hot-swappable switches, and aluminum body.',
      price: 199.99,
      stock: 45,
    },
    {
      name: 'Logitech MX Master 3S Mouse',
      description: 'Ergonomic performance wireless mouse with 8K DPI sensor and quiet clicks.',
      price: 99.99,
      stock: 60,
    },
    {
      name: 'Dell UltraSharp 32" 4K Monitor',
      description: 'U3224KB 4K HDR IPS Black panel with built-in 4K webcam and Thunderbolt 4 hub.',
      price: 899.50,
      stock: 20,
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling wireless headphones with Auto NC Optimizer.',
      price: 398.00,
      stock: 35,
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (!existing) {
      const prod = await prisma.product.create({ data: item });
      createdProducts.push(prod);
    } else {
      createdProducts.push(existing);
    }
  }
  console.log(`📦 Seeded ${createdProducts.length} products`);

  // 4. Seed initial order if none exist
  const orderCount = await prisma.order.count();
  if (orderCount === 0 && createdProducts.length >= 2) {
    const p1 = createdProducts[1]; // Keychron Keyboard
    const p2 = createdProducts[2]; // MX Master Mouse

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        totalAmount: (Number(p1.price) * 2) + Number(p2.price),
        status: 'COMPLETED',
        items: {
          create: [
            {
              productId: p1.id,
              quantity: 2,
              priceAtPurchase: p1.price,
            },
            {
              productId: p2.id,
              quantity: 1,
              priceAtPurchase: p2.price,
            },
          ],
        },
      },
    });

    // Adjust product stock
    await prisma.product.update({
      where: { id: p1.id },
      data: { stock: { decrement: 2 } },
    });
    await prisma.product.update({
      where: { id: p2.id },
      data: { stock: { decrement: 1 } },
    });

    console.log(`🧾 Initial seed order created: ${order.id}`);
  }

  console.log('✅ Database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
