import prisma from './src/config/database';
import slugify from 'slugify';

async function main() {
  const products = await prisma.product.findMany();
  for (const product of products) {
    if (!product.slug) {
      let slug = slugify(product.name, { lower: true, strict: true });
      let counter = 1;
      let existing = await prisma.product.findUnique({ where: { slug } });
      while (existing) {
        slug = `${slugify(product.name, { lower: true, strict: true })}-${counter}`;
        existing = await prisma.product.findUnique({ where: { slug } });
        counter++;
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { slug },
      });
      console.log(`Updated ${product.name} with slug: ${slug}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
