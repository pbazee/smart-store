import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const storageKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

async function uploadToSupabase(base64Data, bucket, objectPath) {
  const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64String = match[2];
  const buffer = Buffer.from(base64String, "base64");

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: storageKey,
      Authorization: `Bearer ${storageKey}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to upload ${objectPath}: ${response.statusText} - ${errorText}`);
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function main() {
  if (!supabaseUrl || !storageKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
  }

  console.log("Starting image migration to Supabase Storage...");
  let updatedProducts = 0;
  let updatedVariants = 0;

  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  for (const product of products) {
    let productUpdated = false;
    const newImages = [];

    // Migrate Product Images
    for (let i = 0; i < product.images.length; i++) {
      const img = product.images[i];
      if (img.startsWith("data:image/")) {
        const objectPath = `products/${product.id}/migrated-${Date.now()}-${i}.jpg`;
        console.log(`Uploading product image ${i + 1}/${product.images.length} for ${product.name}...`);
        const url = await uploadToSupabase(img, "store-assets", objectPath);
        if (url) {
          newImages.push(url);
          productUpdated = true;
        } else {
          newImages.push(img); // Keep original if upload fails
        }
      } else {
        newImages.push(img);
      }
    }

    if (productUpdated) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: newImages },
      });
      updatedProducts++;
      console.log(`✅ Updated product: ${product.name}`);
    }

    // Migrate Variant Images
    for (const variant of product.variants) {
      if (variant.variantImageUrl && variant.variantImageUrl.startsWith("data:image/")) {
        const objectPath = `product-variants/${product.id}/${variant.id}-migrated-${Date.now()}.jpg`;
        console.log(`Uploading variant image for ${variant.color} / ${variant.size}...`);
        const url = await uploadToSupabase(variant.variantImageUrl, "product-variants", objectPath);
        if (url) {
          await prisma.variant.update({
            where: { id: variant.id },
            data: { variantImageUrl: url },
          });
          updatedVariants++;
          console.log(`✅ Updated variant: ${variant.color}`);
        }
      }
    }
  }

  console.log(`\nMigration Complete!`);
  console.log(`Updated ${updatedProducts} products.`);
  console.log(`Updated ${updatedVariants} variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
