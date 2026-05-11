// Core domain types for RSC benchmark e-commerce app
// Framework-agnostic - used across all implementations

// ============ User & Auth ============

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: 'customer' | 'admin';
  locale: Locale;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'github';
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// ============ Products ============

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  brandId: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  taxable: boolean;
  taxClassId: string | null;
  weight: number | null;
  weightUnit: 'kg' | 'lb' | 'oz' | 'g';
  status: 'draft' | 'active' | 'archived';
  featuredImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weight: number | null;
  options: VariantOption[];
  imageUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOption {
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Large", "Red"
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  createdAt: Date;
}

// ============ Inventory ============

export interface InventoryItem {
  id: string;
  variantId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  updatedAt: Date;
}

export interface InventoryLocation {
  id: string;
  name: string;
  address: Address;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  quantity: number;
  type: 'adjustment' | 'sale' | 'return' | 'transfer' | 'restock';
  reason: string | null;
  referenceId: string | null;
  referenceType: 'order' | 'transfer' | 'manual' | null;
  createdAt: Date;
  createdBy: string;
}

// ============ Cart ============

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: CartItem[];
  appliedCoupons: AppliedCoupon[];
  shippingAddressId: string | null;
  billingAddressId: string | null;
  currency: Currency;
  locale: Locale;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
  variant: ProductVariant;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
}

// ============ Orders ============

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  currency: Currency;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'partially_refunded'
  | 'refunded'
  | 'failed'
  | 'voided';

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'returned';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
  imageUrl: string | null;
  createdAt: Date;
}

// ============ Addresses ============

export interface Address {
  id: string;
  userId: string | null;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Reviews ============

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  content: string;
  pros: string[];
  cons: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  url: string;
  altText: string | null;
  position: number;
  createdAt: Date;
}

export interface ReviewHelpful {
  id: string;
  reviewId: string;
  userId: string;
  helpful: boolean;
  createdAt: Date;
}

// ============ Promotions & Coupons ============

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  discountValue: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  applicableProducts: string[] | null;
  applicableCategories: string[] | null;
  excludedProducts: string[] | null;
  startsAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: 'sale' | 'bundle' | 'bogo' | 'tiered' | 'flash_sale';
  rules: PromotionRule[];
  priority: number;
  stackable: boolean;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionRule {
  condition: PromotionCondition;
  action: PromotionAction;
}

export interface PromotionCondition {
  type: 'product' | 'category' | 'cart_total' | 'quantity' | 'user_group';
  operator: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: string | number | string[];
}

export interface PromotionAction {
  type: 'percentage_off' | 'fixed_off' | 'free_item' | 'free_shipping';
  value: number | string;
  maxDiscount?: number;
}

// ============ Wishlists ============

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId: string | null;
  addedAt: Date;
  note: string | null;
}

// ============ i18n & Currency ============

export type Locale = 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR' | 'es-ES' | 'ja-JP' | 'zh-CN';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: Date;
}

export interface Translation {
  id: string;
  entityType: 'product' | 'category' | 'brand';
  entityId: string;
  locale: Locale;
  field: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Tax ============

export interface TaxClass {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface TaxRate {
  id: string;
  taxClassId: string;
  country: string;
  state: string | null;
  postalCode: string | null;
  city: string | null;
  rate: number;
  name: string;
  priority: number;
  compound: boolean;
  shipping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Shipping ============

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  carrier: string | null;
  estimatedDays: { min: number; max: number };
  price: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
  zones: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[] | null;
  postalCodes: string[] | null;
  createdAt: Date;
}

// ============ Payment (Mock) ============

export interface PaymentIntent {
  id: string;
  orderId: string | null;
  amount: number;
  currency: Currency;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod | null;
  clientSecret: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string | null;
  type: 'card' | 'bank_transfer' | 'paypal';
  card?: {
    brand: 'visa' | 'mastercard' | 'amex' | 'discover';
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: number;
  reason: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
}

// ============ Search & Filters ============

export interface ProductFilter {
  categories?: string[];
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
}

export interface ProductSort {
  field: 'price' | 'name' | 'createdAt' | 'rating' | 'popularity';
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============ Analytics (for complex app) ============

export interface ProductView {
  id: string;
  productId: string;
  userId: string | null;
  sessionId: string;
  source: string | null;
  createdAt: Date;
}

export interface SearchQuery {
  id: string;
  query: string;
  userId: string | null;
  sessionId: string;
  resultsCount: number;
  clickedProductId: string | null;
  createdAt: Date;
}

// ============ Simple App Types ============

export interface LandingPageSection {
  id: string;
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'faq';
  title: string;
  subtitle: string | null;
  content: unknown;
  position: number;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  highlighted: boolean;
  ctaText: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  content: string;
  avatarUrl: string | null;
  rating: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ContactFormSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}
