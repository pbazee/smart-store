export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  categoryId?: string | null;
  gender: "men" | "women" | "unisex" | "children";
  tags: string[];
  basePrice: number;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type LandingSection = "popular" | "trending" | "new_arrivals" | "recommended";

export interface LandingSectionOverride {
  id: number;
  section: LandingSection;
  productId: string;
  product: Product;
  priority: number;
  activeFrom?: string | Date | null;
  activeUntil?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  authorName: string;
  authorCity?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  verifiedPurchase: boolean;
  createdAt: string | Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string | Date;
}

export interface AnnouncementMessage {
  id: string;
  text: string;
  icon: string;
  link?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string | Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "replied";
  createdAt: string | Date;
  repliedAt?: string | Date | null;
}

export type PopupDisplayTarget = "homepage" | "all" | "shop" | "product";

export interface Popup {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  ctaText: string;
  ctaLink: string;
  showOn: PopupDisplayTarget;
  delaySeconds: number;
  isActive: boolean;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "youtube"
  | "linkedin"
  | "whatsapp";

export type WhatsAppPosition = "left" | "right";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  icon?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WhatsAppSettings {
  id: string;
  phoneNumber: string;
  defaultMessage: string;
  isActive: boolean;
  position?: WhatsAppPosition;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StoreSettings {
  id: number;
  storeName?: string | null;
  storeTagline?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  adminNotificationEmail?: string | null;
  contactPhone?: string | null;
  footerContactPhone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  isHomepageVisible?: boolean;
  homepageSubtitle?: string | null;
  homepageImageUrl?: string | null;
  homepageOrder?: number;
  children?: Category[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface HomepageCategory {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  link: string;
  parentCategoryId?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PromoBanner {
  id: string;
  badgeText?: string | null;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string | Date;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  moodTags: string[];
  locationBadge: string;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
  publishedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type CouponDiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxUsage?: number | null;
  usedCount: number;
  expiresAt?: string | Date | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  orders?: Order[];
}

export interface AppliedCoupon {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  description?: string;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId?: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "mpesa" | "card" | "cash" | string;
  subtotal?: number;
  shippingAmount?: number;
  shippingRuleName?: string | null;
  shippingRuleId?: number | null;
  discountAmount?: number;
  couponCode?: string | null;
  total: number;
  address: string;
  city: string;
  county?: string;
  notes?: string;
  paystackReference?: string | null;
  paymentVerifiedAt?: string | Date | null;
  stockReservedAt?: string | Date | null;
  reservationExpiresAt?: string | Date | null;
  stockReleasedAt?: string | Date | null;
  items: OrderItem[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ShippingRule {
  id: number;
  name: string;
  description?: string | null;
  county?: string | null;
  counties: string[];
  deliveryFeeKES: number;
  estimatedDays: number;
  countries: string[];
  regions: string[];
  towns: string[];
  freeAboveKES?: number | null;
  isActive: boolean;
  priority: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FilterState {
  category: string[];
  subcategory: string[];
  gender: string[];
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
  search: string;
  sortBy: string;
}

export type UserRole = "guest" | "customer" | "admin";

export interface SessionUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  role: UserRole;
  isDemo?: boolean;
  authProvider?: "supabase" | "demo" | "local";
}

export interface ParsedSearchIntent {
  rawQuery: string;
  normalizedQuery: string;
  priceMin?: number;
  priceMax?: number;
  colors: string[];
  categories: string[];
  genders: string[];
  tags: string[];
  terms: string[];
}
