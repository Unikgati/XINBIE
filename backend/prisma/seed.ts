import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dapurgizi.com' },
    update: {},
    create: {
      name: 'Admin Dapur Gizi',
      email: 'admin@dapurgizi.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      phoneWa: '628123456789',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Test user
  const userPassword = await bcrypt.hash('User1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@example.com',
      password: userPassword,
      role: 'USER',
      emailVerifiedAt: new Date(),
      phoneWa: '628987654321',
    },
  });
  console.log(`✅ User: ${user.email}`);

  // Test driver
  const driverPassword = await bcrypt.hash('Driver123!', 12);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {},
    create: {
      name: 'Test Driver',
      email: 'driver@example.com',
      password: driverPassword,
      role: 'DRIVER',
      emailVerifiedAt: new Date(),
      phoneWa: '628111222333',
    },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      ratingAvg: 4.8,
      totalOrdersDone: 50,
    },
  });
  console.log(`✅ Driver: ${driver.email}`);

  // Categories
  const categories = [
    { name: 'Sayuran', bgColor: '#4CAF50', sortOrder: 1 },
    { name: 'Buah-buahan', bgColor: '#FF9800', sortOrder: 2 },
    { name: 'Bumbu Dapur', bgColor: '#F44336', sortOrder: 3 },
    { name: 'Protein', bgColor: '#795548', sortOrder: 4 },
    { name: 'Bahan Pokok', bgColor: '#9C27B0', sortOrder: 5 },
    { name: 'Minuman', bgColor: '#2196F3', sortOrder: 6 },
    { name: 'Snack Sehat', bgColor: '#FF5722', sortOrder: 7 },
    { name: 'Frozen', bgColor: '#00BCD4', sortOrder: 8 },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(c);
  }
  console.log(`✅ ${createdCategories.length} categories`);

  // Products
  const products = [
    // Sayuran
    { name: 'Brokoli Segar', price: 15000, unit: 'ikat', categoryIdx: 0, isFeatured: true },
    { name: 'Wortel Baby', price: 12000, unit: 'pack', categoryIdx: 0 },
    { name: 'Bayam Organik', price: 8000, unit: 'ikat', categoryIdx: 0 },
    { name: 'Kangkung Hidroponik', price: 10000, unit: 'ikat', categoryIdx: 0 },
    { name: 'Sawi Hijau', price: 7000, unit: 'ikat', categoryIdx: 0 },
    { name: 'Tomat Cherry', price: 18000, unit: 'pack', categoryIdx: 0, isFeatured: true },

    // Buah
    { name: 'Pisang Cavendish', price: 25000, unit: 'sisir', categoryIdx: 1, isFeatured: true },
    { name: 'Apel Fuji', price: 35000, unit: 'kg', categoryIdx: 1, discountPrice: 29000, discountPercent: 17 },
    { name: 'Jeruk Mandarin', price: 45000, unit: 'kg', categoryIdx: 1 },
    { name: 'Alpukat Mentega', price: 30000, unit: 'kg', categoryIdx: 1, isFeatured: true },

    // Bumbu
    { name: 'Bawang Merah', price: 35000, unit: 'kg', categoryIdx: 2 },
    { name: 'Bawang Putih', price: 40000, unit: 'kg', categoryIdx: 2 },
    { name: 'Cabai Rawit', price: 50000, unit: 'kg', categoryIdx: 2, discountPrice: 42000, discountPercent: 16 },
    { name: 'Jahe Merah', price: 25000, unit: 'kg', categoryIdx: 2 },
    { name: 'Kunyit Segar', price: 15000, unit: 'kg', categoryIdx: 2 },

    // Protein
    { name: 'Ayam Kampung Utuh', price: 85000, unit: 'ekor', categoryIdx: 3, isFeatured: true },
    { name: 'Dada Ayam Fillet', price: 45000, unit: 'pack', categoryIdx: 3, discountPrice: 39000, discountPercent: 13 },
    { name: 'Telur Ayam Kampung', price: 35000, unit: 'pack', categoryIdx: 3 },
    { name: 'Ikan Salmon Fillet', price: 95000, unit: 'pack', categoryIdx: 3 },
    { name: 'Tahu Organik', price: 8000, unit: 'pack', categoryIdx: 3 },
    { name: 'Tempe Segar', price: 5000, unit: 'bungkus', categoryIdx: 3 },

    // Bahan Pokok
    { name: 'Beras Organik 5kg', price: 85000, unit: 'karung', categoryIdx: 4, isFeatured: true },
    { name: 'Minyak Goreng 2L', price: 32000, unit: 'botol', categoryIdx: 4 },
    { name: 'Gula Pasir 1kg', price: 15000, unit: 'pack', categoryIdx: 4 },
    { name: 'Tepung Terigu 1kg', price: 12000, unit: 'pack', categoryIdx: 4 },

    // Minuman
    { name: 'Susu UHT Full Cream', price: 18000, unit: 'kotak', categoryIdx: 5 },
    { name: 'Jus Cold Pressed', price: 25000, unit: 'botol', categoryIdx: 5, isFeatured: true },
    { name: 'Air Kelapa Murni', price: 15000, unit: 'botol', categoryIdx: 5 },

    // Snack
    { name: 'Granola Bar', price: 28000, unit: 'pack', categoryIdx: 6, discountPrice: 22000, discountPercent: 21 },
    { name: 'Kacang Almond Panggang', price: 45000, unit: 'pack', categoryIdx: 6 },

    // Frozen
    { name: 'Edamame Frozen', price: 20000, unit: 'pack', categoryIdx: 7 },
    { name: 'Nugget Ayam Homemade', price: 35000, unit: 'pack', categoryIdx: 7, isFeatured: true },
  ];

  for (const p of products) {
    const { categoryIdx, ...data } = p;
    await prisma.product.create({
      data: {
        ...data,
        categoryId: createdCategories[categoryIdx].id,
        description: `${data.name} berkualitas tinggi, segar langsung dari petani pilihan`,
      },
    });
  }
  console.log(`✅ ${products.length} products`);

  // Delivery slots
  const slots = [
    { dayOfWeek: 1, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 1, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 1, label: 'Sore', startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 2, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 2, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 2, label: 'Sore', startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 3, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 3, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 4, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 4, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 5, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 5, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 6, label: 'Pagi', startTime: '08:00', endTime: '14:00' },
  ];

  for (const slot of slots) {
    await prisma.deliverySlot.create({ data: slot });
  }
  console.log(`✅ ${slots.length} delivery slots`);

  // Delivery areas
  await prisma.deliveryArea.createMany({
    data: [
      { name: 'Jakarta Pusat', lat: -6.1751, lng: 106.8650, radiusKm: 5, fee: 5000 },
      { name: 'Jakarta Selatan', lat: -6.2615, lng: 106.8106, radiusKm: 8, fee: 8000 },
      { name: 'Jakarta Barat', lat: -6.1680, lng: 106.7588, radiusKm: 7, fee: 7000 },
      { name: 'Tangerang', lat: -6.1781, lng: 106.6319, radiusKm: 10, fee: 12000 },
    ],
  });
  console.log('✅ 4 delivery areas');

  // Pickup points
  await prisma.pickupPoint.create({
    data: {
      name: 'Gudang Utama Dapur Gizi',
      lat: -6.2088,
      lng: 106.8456,
      fullAddress: 'Jl. Sudirman No. 1, Jakarta Pusat',
      phoneWa: '628123456789',
      operationalHours: 'Sen-Sab 06:00-18:00',
      notesForDriver: 'Masuk lewat pintu belakang, parkir di area loading dock',
    },
  });
  console.log('✅ 1 pickup point');

  // Promo codes
  await prisma.promoCode.createMany({
    data: [
      { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 50000, maxDiscount: 20000, totalUsageLimit: 1000 },
      { code: 'HEMAT15K', type: 'NOMINAL', value: 15000, minOrder: 100000, totalUsageLimit: 500 },
      { code: 'FIRSTORDER', type: 'PERCENT', value: 20, minOrder: 30000, maxDiscount: 30000, perUserLimit: 1, totalUsageLimit: 0 },
    ],
  });
  console.log('✅ 3 promo codes');

  // App settings
  await prisma.appSetting.createMany({
    data: [
      { key: 'min_order_amount', value: '25000' },
      { key: 'max_order_items', value: '50' },
      { key: 'delivery_radius_km', value: '15' },
      { key: 'instant_delivery_fee', value: '10000' },
      { key: 'regular_delivery_fee', value: '5000' },
      { key: 'free_delivery_min', value: '150000' },
      { key: 'admin_wa', value: '628123456789' },
      { key: 'app_version_min', value: '1.0.0' },
    ],
  });
  console.log('✅ App settings');

  console.log('\n🌱 Seeding complete!\n');
  console.log('📧 Admin login: admin@dapurgizi.com / Admin123!');
  console.log('📧 User login:  user@example.com / User1234!');
  console.log('📧 Driver login: driver@example.com / Driver123!\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
