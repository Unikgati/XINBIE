const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (!cat.slug) {
      let slug = slugify(cat.name);
      
      let isUnique = false;
      let counter = 0;
      let currentSlug = slug;
      
      while(!isUnique) {
          const existing = await prisma.category.findFirst({ where: { slug: currentSlug } });
          if (!existing) {
              isUnique = true;
          } else {
              counter++;
              currentSlug = `${slug}-${counter}`;
          }
      }
      
      await prisma.category.update({
        where: { id: cat.id },
        data: { slug: currentSlug }
      });
      console.log(`Updated slug for ${cat.name} -> ${currentSlug}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
