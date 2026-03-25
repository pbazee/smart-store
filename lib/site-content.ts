export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  location: string;
  image: string;
  href: string;
  alt: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
};

export type PopularBrand = {
  name: string;
  anchor: string;
  href: string;
  description: string;
};

export type Testimonial = {
  name: string;
  city: string;
  quote: string;
  date: string;
  avatar: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  image: string;
  imageAlt: string;
  content: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "nairobi-summer-edit",
    eyebrow: "New Collection",
    title: "Summer Arrival",
    highlight: "for Nairobi",
    description:
      "Vibrant hoodies, clean cargos, and statement shades styled for fast city days, golden-hour linkups, and rooftop nights.",
    location: "CBD rooftops and Westlands side streets",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=80",
    href: "/shop?collection=new-arrivals",
    alt: "Streetwear editorial with diverse models in vibrant summer outfits inspired by Nairobi city life",
    gradientFrom: "#130a06",
    gradientTo: "#f97316",
    accent: "Orange",
  },
  {
    id: "city-cargo-mood",
    eyebrow: "Streetwear Drop",
    title: "Light Layers,",
    highlight: "Bold Moves",
    description:
      "Built around cargos, oversized hoodies, and confident color blocking that feels effortless from Kilimani mornings to late-night hangs.",
    location: "Kilimani corners and city cafe stops",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=80",
    href: "/shop?collection=trending",
    alt: "Fashion model in summer streetwear and sunglasses in an urban setting inspired by Nairobi",
    gradientFrom: "#07131a",
    gradientTo: "#38bdf8",
    accent: "Sky",
  },
  {
    id: "golden-hour-essentials",
    eyebrow: "Weekend Uniform",
    title: "Sun-Ready Fits,",
    highlight: "Street-Ready Finish",
    description:
      "Fresh textures and breathable silhouettes for warm afternoons, quick photos, and all-day movement without losing the edge.",
    location: "Karen drives and Upper Hill golden hour",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=80",
    href: "/shop?gender=women",
    alt: "Diverse summer fashion editorial with vibrant outfits and urban East African styling cues",
    gradientFrom: "#0f172a",
    gradientTo: "#22c55e",
    accent: "Emerald",
  },
  {
    id: "hoodie-season-recut",
    eyebrow: "City Staples",
    title: "Hoodies, Cargos,",
    highlight: "and Nairobi Energy",
    description:
      "Our fastest-moving silhouettes remixed with crisp accessories and a sharper summer palette for everyday streetwear rotation.",
    location: "Ngong Road traffic, then the after-plan",
    image:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1800&q=80",
    href: "/shop?gender=men",
    alt: "Streetwear portrait in sunglasses and layered summer style inspired by Nairobi fashion culture",
    gradientFrom: "#111827",
    gradientTo: "#a855f7",
    accent: "Plum",
  },
];

export const popularBrands: PopularBrand[] = [
  {
    name: "Urban Nomad",
    anchor: "urban-nomad",
    href: "/brands#urban-nomad",
    description: "Relaxed layers for Westlands days and late city plans.",
  },
  {
    name: "Safari Signal",
    anchor: "safari-signal",
    href: "/brands#safari-signal",
    description: "Utility cargos, technical outerwear, and sharp movement.",
  },
  {
    name: "Coastline Club",
    anchor: "coastline-club",
    href: "/brands#coastline-club",
    description: "Sun-washed sets and easy resort-to-street dressing.",
  },
  {
    name: "Metro Muse",
    anchor: "metro-muse",
    href: "/brands#metro-muse",
    description: "Statement womenswear with polished city confidence.",
  },
];

export const desktopSecondaryLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?gender=children", label: "Children" },
  { href: "/shop?collection=new-arrivals", label: "New Arrivals" },
  { href: "/shop?collection=trending", label: "Trending" },
  { href: "/blog", label: "Blog" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export const mobileMenuSections = [
  {
    title: "Shop",
    links: [
      { href: "/", label: "Home" },
      { href: "/shop", label: "Shop All" },
      { href: "/shop?gender=men", label: "Men" },
      { href: "/shop?gender=women", label: "Women" },
      { href: "/shop?gender=children", label: "Children" },
      { href: "/brands", label: "Brands" },
      { href: "/shop?collection=new-arrivals", label: "New Arrivals" },
      { href: "/shop?collection=trending", label: "Trending" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/about-us", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Aisha M.",
    city: "Nairobi",
    quote:
      "The hoodie and cargos combo looked even better in person. Delivery was same-day and the fit felt made for Nairobi weather.",
    date: "March 2, 2026",
    avatar: "AM",
  },
  {
    name: "Kevin O.",
    city: "Westlands",
    quote:
      "Clean styling, fast checkout, and the cart remembered exactly what I saved. I wore the bomber out that night and got compliments immediately.",
    date: "February 25, 2026",
    avatar: "KO",
  },
  {
    name: "Brenda N.",
    city: "Kilimani",
    quote:
      "I came for one outfit and ended up planning a whole weekend wardrobe. The new arrivals section is dangerous in the best way.",
    date: "February 19, 2026",
    avatar: "BN",
  },
  {
    name: "Yusuf A.",
    city: "Mombasa",
    quote:
      "The site feels premium, the sizing was accurate, and the sunglasses styling inspo on the homepage actually helped me build a full look.",
    date: "February 10, 2026",
    avatar: "YA",
  },
  {
    name: "Mercy W.",
    city: "Karen",
    quote:
      "Loved how easy it was to move from wishlist to checkout. The set I ordered landed exactly on the vibe I wanted for a rooftop brunch.",
    date: "January 28, 2026",
    avatar: "MW",
  },
  {
    name: "Dennis K.",
    city: "Upper Hill",
    quote:
      "Best streetwear browse I have had from a local store in a while. Fast, polished, and the trending picks were genuinely on point.",
    date: "January 16, 2026",
    avatar: "DK",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "nairobi-streetwear-trends-summer-2026",
    title: "Nairobi Streetwear Trends Summer 2026",
    excerpt:
      "From lighter-weight hoodies to bolder sunglasses, these are the streetwear signals taking over Nairobi this season.",
    category: "Trends",
    readTime: "4 min read",
    publishedAt: "March 8, 2026",
    author: "Editorial Team",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Street style editorial with vibrant summer fashion",
    content: [
      {
        heading: "Why this summer feels different",
        paragraphs: [
          "Nairobi style this season is lighter, brighter, and more confident. The silhouettes are still rooted in streetwear, but the palette has opened up with soft sand, citrus orange, deep navy, and washed green appearing more often.",
          "Instead of heavy layering for the sake of it, people are building smarter looks with one standout piece, a relaxed base, and a sharper accessory finish.",
        ],
      },
      {
        heading: "What is moving now",
        paragraphs: [
          "Cargo trousers remain central, especially when paired with cropped or oversized tops. Sunglasses, caps, and cleaner sneakers are doing more of the styling work that jackets used to do.",
          "That shift makes outfits feel cooler for warm weather while still keeping the visual energy people want from a city fit.",
        ],
      },
    ],
  },
  {
    slug: "how-to-style-cargo-pants",
    title: "How to Style Cargo Pants",
    excerpt:
      "Cargo pants work hardest when the rest of the outfit feels intentional. Here is how to keep them sharp instead of bulky.",
    category: "Styling",
    readTime: "3 min read",
    publishedAt: "March 3, 2026",
    author: "Style Desk",
    image:
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Cargo pants styled in a modern streetwear look",
    content: [
      {
        heading: "Start with the leg shape",
        paragraphs: [
          "The easiest way to make cargos feel current is to balance volume. If the trouser is roomy, keep the top cleaner or cropped. If the top is oversized, choose cargos with a straighter leg and a neat ankle break.",
        ],
      },
      {
        heading: "Use accessories to sharpen the look",
        paragraphs: [
          "A structured pair of sunglasses, a compact crossbody, or a crisp sneaker changes the whole outfit. The goal is to make the cargo feel styled, not accidental.",
        ],
      },
    ],
  },
  {
    slug: "best-hoodies-for-warm-city-evenings",
    title: "Best Hoodies for Warm City Evenings",
    excerpt:
      "The right hoodie for Nairobi is substantial enough for the breeze but breathable enough for movement. These details matter most.",
    category: "Buying Guide",
    readTime: "5 min read",
    publishedAt: "February 27, 2026",
    author: "Smartest Store KE",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Model wearing a premium hoodie in an urban setting",
    content: [
      {
        heading: "Look for weight without stiffness",
        paragraphs: [
          "A good evening hoodie should have enough body to hold shape while still staying breathable. The best pieces feel premium before you even start styling them.",
        ],
      },
      {
        heading: "Color can do the heavy lifting",
        paragraphs: [
          "Charcoal, washed green, and warm neutrals make it easier to rewear one hoodie across different plans. They also pair more easily with cargos, denim, and shorts.",
        ],
      },
    ],
  },
  {
    slug: "sunglasses-that-finish-a-summer-look",
    title: "Sunglasses That Finish a Summer Look",
    excerpt:
      "When the clothes stay simple, sunglasses become the attitude piece. These frame shapes are winning right now.",
    category: "Accessories",
    readTime: "3 min read",
    publishedAt: "February 21, 2026",
    author: "Accessories Edit",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Summer sunglasses and accessories styled for streetwear",
    content: [
      {
        heading: "Frame shape changes the whole read",
        paragraphs: [
          "Slim rectangular frames look sharper and more directional, while rounder or sportier lenses feel more relaxed. Picking the right frame can define the whole outfit before color even enters the conversation.",
        ],
      },
      {
        heading: "Keep the rest of the outfit clean",
        paragraphs: [
          "Let the glasses do the talking. A simple tee, well-cut cargos, and one tonal layer is usually enough to make them land.",
        ],
      },
    ],
  },
  {
    slug: "weekend-outfit-formulas-for-nairobi",
    title: "Weekend Outfit Formulas for Nairobi",
    excerpt:
      "Three easy formulas for brunch, errands, and rooftop plans when you want the outfit to feel relaxed but still considered.",
    category: "Outfit Guide",
    readTime: "4 min read",
    publishedAt: "February 14, 2026",
    author: "Weekend Edit",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Summer weekend fashion styled in a city backdrop",
    content: [
      {
        heading: "Brunch to late afternoon",
        paragraphs: [
          "Start with relaxed trousers, a fitted top, and a light overshirt. Add white sneakers and one standout accessory to keep the look polished without trying too hard.",
        ],
      },
      {
        heading: "Rooftop later on",
        paragraphs: [
          "Swap the overshirt for a bomber or sharp blazer, keep the base simple, and add cleaner jewelry or darker frames. The transition works because the foundation stays easy.",
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
