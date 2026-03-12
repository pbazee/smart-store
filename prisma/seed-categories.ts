import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("?? Seeding categories...");

  try {
    const categories = [
      { name: "Shoes", slug: "shoes", description: "Footwear for every occasion" },
      { name: "Clothes", slug: "clothes", description: "Fashion and apparel" },
      { name: "Accessories", slug: "accessories", description: "Complete your look" },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      });
      console.log(`? Created category: ${category.name}`);
    }

    console.log("? Categories seeded successfully!");
  } catch (error) {
    console.error("? Category seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
