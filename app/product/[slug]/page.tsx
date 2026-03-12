import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductJsonLd } from "@/components/shop/product-json-ld";
import { RecommendationCarousel } from "@/components/shop/recommendation-carousel";
import { getProductByIdentifier, getProducts } from "@/lib/data-service";
import { buildProductHref } from "@/lib/product-routes";
import { getCityInspiredProducts, getCustomersAlsoBought } from "@/lib/recommendations";
import { getProductReviews } from "@/lib/reviews-service";

export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductByIdentifier(slug);

  if (!product) {
    notFound();
  }

  if (slug !== product.slug) {
    redirect(buildProductHref(product));
  }

  const [reviews, allProducts] = await Promise.all([
    getProductReviews(product.id),
    getProducts(),
  ]);

  const averageRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          ).toFixed(1)
        )
      : product.rating;
  const alsoBought = getCustomersAlsoBought(allProducts, product, 8);
  const cityInspired = getCityInspiredProducts(
    allProducts.filter((candidate) => candidate.id !== product.id),
    "Nairobi",
    8
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductJsonLd
        product={product}
        ratingValue={averageRating}
        reviewCount={reviews.length || product.reviewCount}
      />

      <ProductDetail product={product} reviews={reviews} />

      <div className="mt-20">
        <RecommendationCarousel
          eyebrow="Smart pairing"
          title="Customers who bought this also bought"
          description="Cross-category recommendations grounded in style proximity, pricing, and what fits naturally into the same wardrobe."
          products={alsoBought}
        />
        <RecommendationCarousel
          eyebrow="City signal"
          title="Inspired by your city"
          description="More Nairobi-coded pieces with the same mix of flexibility, edge, and easy repeat wear."
          products={cityInspired}
        />
      </div>
    </div>
  );
}
