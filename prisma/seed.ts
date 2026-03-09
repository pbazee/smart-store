import { PrismaClient } from "@prisma/client";
import { mockProducts } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  try {
    // Clear existing data
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.order.deleteMany();

    // Seed products with variants
    for (const product of mockProducts) {
      const createdProduct = await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          gender: product.gender,
          tags: product.tags,
          basePrice: product.basePrice,
          images: product.images,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          isFeatured: product.isFeatured || false,
          isNew: product.isNew || false,
        },
      });

      // Create variants for each product
      for (const variant of product.variants) {
        await prisma.variant.create({
          data: {
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            stock: variant.stock,
            price: variant.price,
            productId: createdProduct.id,
          },
        });
      }
    }

    console.log("✅ Seed completed successfully!");
    console.log(`📦 Created ${mockProducts.length} products`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
