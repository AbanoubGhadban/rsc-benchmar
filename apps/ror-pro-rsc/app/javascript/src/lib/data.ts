// Mock data functions for complex app
// Using static generation for benchmark fairness

import { generateSeedData } from '@shared/seed';
import type {
  Product,
  ProductVariant,
  Category,
  Brand,
  Review,
  Cart,
  Order,
  PaginatedResult,
  ProductFilter,
  ProductSort,
} from '@shared/types';

// Generate seed data once
const seedData = generateSeedData(42);

// Products
export async function getProducts(
  filter: ProductFilter = {},
  sort: ProductSort = { field: 'createdAt', direction: 'desc' },
  page: number = 1,
  pageSize: number = 12,
  searchQuery?: string
): Promise<PaginatedResult<Product & { avgRating: number; reviewCount: number }>> {
  let products = seedData.products.filter(p => p.status === 'active');

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (filter.categories?.length) {
    products = products.filter(p => filter.categories!.includes(p.categoryId));
  }

  if (filter.brands?.length) {
    products = products.filter(p => p.brandId && filter.brands!.includes(p.brandId));
  }

  if (filter.priceMin !== undefined) {
    products = products.filter(p => p.basePrice >= filter.priceMin!);
  }

  if (filter.priceMax !== undefined) {
    products = products.filter(p => p.basePrice <= filter.priceMax!);
  }

  if (filter.inStock) {
    const inStockVariants = new Set(
      seedData.inventory.filter(i => i.quantity > 0).map(i => i.variantId)
    );
    const inStockProducts = new Set(
      seedData.variants.filter(v => inStockVariants.has(v.id)).map(v => v.productId)
    );
    products = products.filter(p => inStockProducts.has(p.id));
  }

  // Sort
  const sortField = sort.field;
  const sortDir = sort.direction === 'asc' ? 1 : -1;

  products.sort((a, b) => {
    if (sortField === 'price') return (a.basePrice - b.basePrice) * sortDir;
    if (sortField === 'name') return a.name.localeCompare(b.name) * sortDir;
    return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * sortDir;
  });

  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = products.slice(start, start + pageSize);

  // Add ratings
  const itemsWithRatings = items.map(p => {
    const reviews = seedData.reviews.filter(r => r.productId === p.id && r.status === 'approved');
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    return { ...p, avgRating, reviewCount: reviews.length };
  });

  return {
    items: itemsWithRatings,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return seedData.products.find(p => p.slug === slug && p.status === 'active') || null;
}

export async function getProductById(id: string): Promise<(Product & { variants: ProductVariant[] }) | null> {
  const product = seedData.products.find(p => p.id === id && p.status === 'active');
  if (!product) return null;
  const variants = seedData.variants.filter(v => v.productId === id);
  return { ...product, variants };
}

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  return seedData.variants.filter(v => v.productId === productId);
}

export async function getProductReviews(productId: string, limit = 10): Promise<Review[]> {
  return seedData.reviews
    .filter(r => r.productId === productId && r.status === 'approved')
    .sort((a, b) => b.helpfulCount - a.helpfulCount)
    .slice(0, limit);
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
  return seedData.products
    .filter(p => p.categoryId === categoryId && p.id !== productId && p.status === 'active')
    .slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return seedData.products
    .filter(p => p.status === 'active' && p.tags.includes('featured'))
    .slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return seedData.products
    .filter(p => p.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  return seedData.products
    .filter(p => p.status === 'active' && p.tags.includes('bestseller'))
    .slice(0, limit);
}

export async function searchProducts(query: string, limit = 20): Promise<Product[]> {
  const q = query.toLowerCase();
  return seedData.products
    .filter(p =>
      p.status === 'active' &&
      (p.name.toLowerCase().includes(q) ||
       p.description.toLowerCase().includes(q) ||
       p.tags.some(t => t.toLowerCase().includes(q)))
    )
    .slice(0, limit);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  return seedData.categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return seedData.categories.find(c => c.slug === slug) || null;
}

export async function getCategoryHierarchy(): Promise<(Category & { children: Category[] })[]> {
  const topLevel = seedData.categories.filter(c => c.parentId === null);
  return topLevel.map(parent => ({
    ...parent,
    children: seedData.categories.filter(c => c.parentId === parent.id),
  }));
}

// Brands
export async function getBrands(): Promise<Brand[]> {
  return seedData.brands;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return seedData.brands.find(b => b.slug === slug) || null;
}

// User (mock session) - Return a demo user for the benchmark
export async function getCurrentUser() {
  const demoUser = seedData.users[0];
  const addresses = seedData.addresses.filter(a => a.userId === demoUser.id);
  return {
    ...demoUser,
    addresses: addresses.map(a => ({
      id: a.id,
      label: a.type === 'shipping' ? 'Shipping' : 'Billing',
      street: a.addressLine1,
      apartment: a.addressLine2 || '',
      city: a.city,
      state: a.state || '',
      zip: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    })),
  };
}

// Cart (in-memory for demo)
let mockCart: Cart = {
  id: 'demo-cart',
  userId: null,
  sessionId: 'demo-session',
  items: [],
  appliedCoupons: [],
  shippingAddressId: null,
  billingAddressId: null,
  currency: 'USD',
  locale: 'en-US',
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  shippingTotal: 0,
  total: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getCart(): Promise<Cart> {
  return mockCart;
}

export async function addToCart(variantId: string, quantity: number): Promise<Cart> {
  const variant = seedData.variants.find(v => v.id === variantId);
  if (!variant) throw new Error('Variant not found');

  const product = seedData.products.find(p => p.id === variant.productId);
  if (!product) throw new Error('Product not found');

  const existingItem = mockCart.items.find(i => i.variantId === variantId);

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
  } else {
    mockCart.items.push({
      id: `item-${Date.now()}`,
      cartId: mockCart.id,
      variantId,
      quantity,
      unitPrice: variant.price,
      totalPrice: variant.price * quantity,
      product,
      variant,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  recalculateCart();
  return mockCart;
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<Cart> {
  const item = mockCart.items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');

  if (quantity <= 0) {
    mockCart.items = mockCart.items.filter(i => i.id !== itemId);
  } else {
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
  }

  recalculateCart();
  return mockCart;
}

export async function removeFromCart(itemId: string): Promise<Cart> {
  mockCart.items = mockCart.items.filter(i => i.id !== itemId);
  recalculateCart();
  return mockCart;
}

function recalculateCart() {
  mockCart.subtotal = mockCart.items.reduce((sum, i) => sum + i.totalPrice, 0);
  mockCart.taxTotal = mockCart.subtotal * 0.08;
  mockCart.shippingTotal = mockCart.subtotal > 50 ? 0 : 9.99;
  mockCart.total = mockCart.subtotal + mockCart.taxTotal + mockCart.shippingTotal - mockCart.discountTotal;
  mockCart.updatedAt = new Date();
}

// Orders (from seed data)
export async function getUserOrders(userId: string): Promise<Order[]> {
  return seedData.orders
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrders(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Order>> {
  const user = await getCurrentUser();
  const orders = seedData.orders
    .filter(o => o.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = orders.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = orders.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

interface EnrichedOrderItem {
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
  productSlug: string;
}

interface EnrichedOrder extends Omit<Order, 'items' | 'shippingAddress'> {
  items: EnrichedOrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    apartment: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment: { last4: string };
}

export async function getOrderById(orderId: string): Promise<EnrichedOrder | null> {
  const order = seedData.orders.find(o => o.id === orderId);
  if (!order) return null;

  // Enrich items with product slug
  const enrichedItems: EnrichedOrderItem[] = order.items.map(item => {
    const variant = seedData.variants.find(v => v.id === item.variantId);
    const product = variant ? seedData.products.find(p => p.id === variant.productId) : null;
    return {
      ...item,
      productSlug: product?.slug || '',
    };
  });

  return {
    ...order,
    items: enrichedItems,
    shippingAddress: {
      firstName: 'Demo',
      lastName: 'User',
      street: '123 Main St',
      apartment: '',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
    },
    payment: {
      last4: '4242',
    },
  };
}

// Wishlist (mock)
export async function getWishlist(): Promise<Product[]> {
  // Return first 6 products as mock wishlist for demo
  return seedData.products
    .filter(p => p.status === 'active')
    .slice(0, 6);
}

// Inventory
export async function getVariantStock(variantId: string): Promise<number> {
  const inv = seedData.inventory.find(i => i.variantId === variantId);
  return inv ? inv.quantity - inv.reservedQuantity : 0;
}

// Currency formatting
const currencyFormatters: Record<string, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
};

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return currencyFormatters[currency]?.format(amount) ?? `$${amount.toFixed(2)}`;
}

// Rating helpers
export function getProductRating(productId: string): { average: number; count: number } {
  const reviews = seedData.reviews.filter(r => r.productId === productId && r.status === 'approved');
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

// Get all seed data for traditional SSR (single data fetch)
export function getAllSeedData() {
  return seedData;
}
