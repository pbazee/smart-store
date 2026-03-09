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

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "mpesa" | "card" | "cash";
  total: number;
  items: {
    productId: string;
    variantId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  address: string;
  createdAt: string;
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
