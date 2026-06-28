import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ??=
  "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate";

const prisma = new PrismaClient();

const seedProducts = [
  {
    id: "prod_001",
    name: "Mechanical Keyboard",
    price: 120,
  },
  {
    id: "prod_002",
    name: "Gaming Mouse",
    price: 45,
  },
];

async function main() {
  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: {
        id: product.id,
      },
      update: {
        name: product.name,
        price: product.price,
      },
      create: product,
    });
  }

  console.log(`Seeded ${seedProducts.length} products`);
}

main()
  .catch((error) => {
    console.error("Failed to seed product data");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });