import prisma from './src/config/database';
async function main() {
  const products = await prisma.product.findMany({ where: { discountPrice: { not: null } } });
  for (const p of products) {
    if (p.price > 0 && p.discountPrice && p.discountPrice < p.price) {
      const discountPercent = Math.round(((p.price - p.discountPrice) / p.price) * 100);
      await prisma.product.update({ where: { id: p.id }, data: { discountPercent } });
    }
  }
}
main().catch(() => {}).finally(async () => { await prisma.$disconnect(); });
