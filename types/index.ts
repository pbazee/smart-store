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
  category: "shoes" | "clothes" | "accessories";
  subcategory: string;
  gender: "men" | "women" | "unisex";
  tags: string[];
  basePrice: number;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
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

export interface HomepageCategory {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  link: string;
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
}

export interface AppliedCoupon {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
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
  discountAmount?: number;
  couponCode?: string | null;
  total: number;
  address: string;
  city: string;
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

export interface FilterState {
  category: string[];
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
  authProvider?: "clerk" | "demo" | "local";
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
