import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data-service";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductCard } from "@/components/shop/product-card";
import { mockProducts } from "@/lib/mock-data";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProductDetail product={product} />

      {/* Related Products */}
      <section className="mt-20">
        <h2 className="text-2xl font-black mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return mockProducts.map((p) => ({ slug: p.slug }));
}
