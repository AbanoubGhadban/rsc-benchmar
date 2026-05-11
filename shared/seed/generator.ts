// Seed data generator for RSC benchmark
// Generates: 1K products, 500 users, 2K orders with realistic data

import type {
  User,
  Product,
  ProductVariant,
  Category,
  Brand,
  Order,
  OrderItem,
  Review,
  Address,
  Coupon,
  Promotion,
  Feature,
  PricingPlan,
  Testimonial,
  FAQ,
  InventoryItem,
  Wishlist,
  WishlistItem,
  Currency,
  Locale,
} from '../types';

// Deterministic random for reproducible seeds
class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  pickMultiple<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }

  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  uuid(): string {
    const hex = () => this.int(0, 15).toString(16);
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = this.int(0, 15);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  date(start: Date, end: Date): Date {
    const time = start.getTime() + this.next() * (end.getTime() - start.getTime());
    return new Date(time);
  }

  decimal(min: number, max: number, decimals: number = 2): number {
    const value = min + this.next() * (max - min);
    return Number(value.toFixed(decimals));
  }
}

// Data pools
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
];

const ADJECTIVES = [
  'Premium', 'Classic', 'Modern', 'Elegant', 'Professional', 'Vintage', 'Essential',
  'Luxury', 'Ultra', 'Advanced', 'Pro', 'Elite', 'Supreme', 'Deluxe', 'Prime',
];

const PRODUCT_TYPES = [
  'Laptop', 'Headphones', 'Keyboard', 'Mouse', 'Monitor', 'Webcam', 'Microphone',
  'Chair', 'Desk', 'Lamp', 'Speaker', 'Charger', 'Cable', 'Stand', 'Hub',
  'Backpack', 'Sleeve', 'Case', 'Mat', 'Dock', 'Adapter', 'Drive', 'Memory',
  'Watch', 'Tracker', 'Earbuds', 'Camera', 'Tripod', 'Light', 'Filter',
];

const COLORS = ['Black', 'White', 'Silver', 'Space Gray', 'Gold', 'Rose Gold', 'Blue', 'Red', 'Green'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STORAGE_SIZES = ['128GB', '256GB', '512GB', '1TB', '2TB'];

const CITIES = [
  { city: 'New York', state: 'NY', country: 'US' },
  { city: 'Los Angeles', state: 'CA', country: 'US' },
  { city: 'Chicago', state: 'IL', country: 'US' },
  { city: 'Houston', state: 'TX', country: 'US' },
  { city: 'Phoenix', state: 'AZ', country: 'US' },
  { city: 'London', state: null, country: 'GB' },
  { city: 'Paris', state: null, country: 'FR' },
  { city: 'Berlin', state: null, country: 'DE' },
  { city: 'Tokyo', state: null, country: 'JP' },
  { city: 'Sydney', state: 'NSW', country: 'AU' },
];

const STREETS = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Park Blvd', 'Washington St',
  'Cedar Ln', 'Elm St', 'Pine Rd', 'Lake Ave', 'River Rd',
];

const REVIEW_TITLES_POSITIVE = [
  'Excellent product!', 'Highly recommend', 'Best purchase ever', 'Worth every penny',
  'Exceeded expectations', 'Amazing quality', 'Perfect for my needs', 'Love it!',
];

const REVIEW_TITLES_NEGATIVE = [
  'Disappointed', 'Not as expected', 'Could be better', 'Needs improvement',
  'Average at best', 'Overpriced', 'Quality issues', 'Would not recommend',
];

const REVIEW_CONTENT = [
  'The build quality is exceptional and it performs exactly as advertised.',
  'I have been using this for a month now and it has exceeded all my expectations.',
  'Great value for the price. Would definitely purchase again.',
  'The design is sleek and modern. It fits perfectly in my setup.',
  'Customer service was helpful when I had questions about the product.',
  'Shipping was fast and the packaging was secure.',
  'This has become an essential part of my daily routine.',
  'I compared several options before choosing this one, and I am glad I did.',
];

const PROS = [
  'Durable construction', 'Easy to use', 'Great value', 'Fast shipping',
  'Beautiful design', 'Lightweight', 'Excellent performance', 'Good battery life',
];

const CONS = [
  'Expensive', 'Learning curve', 'Limited colors', 'No warranty',
  'Manual unclear', 'Heavy', 'Slow updates', 'Battery drains fast',
];

export interface SeedData {
  users: Omit<User, 'passwordHash'>[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  variants: ProductVariant[];
  inventory: InventoryItem[];
  addresses: Address[];
  orders: Order[];
  orderItems: OrderItem[];
  reviews: Review[];
  wishlists: Wishlist[];
  wishlistItems: WishlistItem[];
  coupons: Coupon[];
  promotions: Promotion[];
  // Simple app data
  features: Feature[];
  pricingPlans: PricingPlan[];
  testimonials: Testimonial[];
  faqs: FAQ[];
}

export function generateSeedData(seed: number = 42): SeedData {
  const rng = new SeededRandom(seed);
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Generate categories (20 categories with hierarchy)
  const categories: Category[] = [];
  const topLevelCategories = ['Electronics', 'Office', 'Accessories', 'Audio', 'Storage'];

  topLevelCategories.forEach((name, i) => {
    const parentId = rng.uuid();
    categories.push({
      id: parentId,
      name,
      slug: name.toLowerCase(),
      description: `Shop our ${name.toLowerCase()} collection`,
      parentId: null,
      imageUrl: `https://picsum.photos/seed/${name}/400/300`,
      position: i,
      createdAt: oneYearAgo,
      updatedAt: oneYearAgo,
    });

    // Add 3 subcategories each
    const subcats = {
      'Electronics': ['Laptops', 'Tablets', 'Phones'],
      'Office': ['Desks', 'Chairs', 'Lighting'],
      'Accessories': ['Cases', 'Cables', 'Chargers'],
      'Audio': ['Headphones', 'Speakers', 'Microphones'],
      'Storage': ['SSDs', 'HDDs', 'Memory Cards'],
    }[name] || [];

    subcats.forEach((subName, j) => {
      categories.push({
        id: rng.uuid(),
        name: subName,
        slug: subName.toLowerCase().replace(/\s+/g, '-'),
        description: `Browse ${subName}`,
        parentId,
        imageUrl: `https://picsum.photos/seed/${subName}/400/300`,
        position: j,
        createdAt: oneYearAgo,
        updatedAt: oneYearAgo,
      });
    });
  });

  // Generate brands (15 brands)
  const brands: Brand[] = [
    'TechPro', 'SoundMax', 'ErgoWorks', 'DataVault', 'PixelPerfect',
    'PowerCore', 'SwiftLink', 'CloudNine', 'PrimeTech', 'NexGen',
    'OmniGear', 'ZenithX', 'Velocity', 'Quantum', 'Apex',
  ].map((name, i) => ({
    id: rng.uuid(),
    name,
    slug: name.toLowerCase(),
    logoUrl: `https://picsum.photos/seed/${name}/200/200`,
    description: `${name} - Quality products for modern life`,
    createdAt: oneYearAgo,
  }));

  // Generate 1000 products with variants
  const products: Product[] = [];
  const variants: ProductVariant[] = [];
  const inventory: InventoryItem[] = [];
  const locationId = rng.uuid();

  for (let i = 0; i < 1000; i++) {
    const productId = rng.uuid();
    const adj = rng.pick(ADJECTIVES);
    const type = rng.pick(PRODUCT_TYPES);
    const productName = `${adj} ${type}`;
    const basePrice = rng.decimal(29.99, 999.99);
    const category = rng.pick(categories.filter(c => c.parentId !== null));
    const brand = rng.pick(brands);

    const product: Product = {
      id: productId,
      sku: `SKU-${String(i + 1).padStart(5, '0')}`,
      name: productName,
      slug: productName.toLowerCase().replace(/\s+/g, '-') + `-${i}`,
      description: `The ${productName} is designed for professionals who demand the best.
        Features include premium materials, ergonomic design, and cutting-edge technology.
        Perfect for both work and personal use. Backed by our satisfaction guarantee.`,
      shortDescription: `Premium ${type.toLowerCase()} with advanced features`,
      categoryId: category.id,
      brandId: brand.id,
      basePrice,
      compareAtPrice: rng.bool(0.3) ? rng.decimal(basePrice * 1.1, basePrice * 1.5) : null,
      costPrice: rng.decimal(basePrice * 0.4, basePrice * 0.6),
      taxable: true,
      taxClassId: null,
      weight: rng.decimal(0.1, 5),
      weightUnit: 'kg',
      status: rng.bool(0.9) ? 'active' : 'draft',
      featuredImageUrl: `https://picsum.photos/seed/product${i}/600/600`,
      metaTitle: productName,
      metaDescription: `Shop ${productName} - Free shipping on orders over $50`,
      tags: rng.pickMultiple(['new', 'bestseller', 'sale', 'featured', 'limited'], rng.int(0, 3)),
      createdAt: rng.date(oneYearAgo, sixMonthsAgo),
      updatedAt: rng.date(sixMonthsAgo, now),
    };
    products.push(product);

    // Generate 2-4 variants per product
    const variantCount = rng.int(2, 4);
    const hasColor = rng.bool(0.7);
    const hasSize = rng.bool(0.3);
    const hasStorage = rng.bool(0.2);

    for (let v = 0; v < variantCount; v++) {
      const variantId = rng.uuid();
      const options: { name: string; value: string }[] = [];

      if (hasColor) options.push({ name: 'Color', value: rng.pick(COLORS) });
      if (hasSize) options.push({ name: 'Size', value: rng.pick(SIZES) });
      if (hasStorage) options.push({ name: 'Storage', value: rng.pick(STORAGE_SIZES) });
      if (options.length === 0) options.push({ name: 'Option', value: `Variant ${v + 1}` });

      const variantName = options.map(o => o.value).join(' / ');
      const priceModifier = rng.decimal(-0.1, 0.2);
      const variantPrice = Number((basePrice * (1 + priceModifier)).toFixed(2));

      const variant: ProductVariant = {
        id: variantId,
        productId,
        sku: `${product.sku}-V${v + 1}`,
        name: variantName,
        price: variantPrice,
        compareAtPrice: product.compareAtPrice ? Number((product.compareAtPrice * (1 + priceModifier)).toFixed(2)) : null,
        costPrice: product.costPrice ? Number((product.costPrice * (1 + priceModifier)).toFixed(2)) : null,
        weight: product.weight,
        options,
        imageUrl: `https://picsum.photos/seed/variant${i}-${v}/600/600`,
        position: v,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
      variants.push(variant);

      // Inventory for each variant
      inventory.push({
        id: rng.uuid(),
        variantId,
        locationId,
        quantity: rng.int(0, 200),
        reservedQuantity: rng.int(0, 10),
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: rng.bool(0.2),
        updatedAt: now,
      });
    }
  }

  // Generate 500 users
  const users: Omit<User, 'passwordHash'>[] = [];
  const addresses: Address[] = [];

  for (let i = 0; i < 500; i++) {
    const userId = rng.uuid();
    const firstName = rng.pick(FIRST_NAMES);
    const lastName = rng.pick(LAST_NAMES);
    const locales: Locale[] = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP'];
    const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY'];

    users.push({
      id: userId,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      firstName,
      lastName,
      avatarUrl: rng.bool(0.6) ? `https://i.pravatar.cc/150?u=${userId}` : null,
      role: 'customer',
      locale: rng.pick(locales),
      currency: rng.pick(currencies),
      createdAt: rng.date(oneYearAgo, sixMonthsAgo),
      updatedAt: rng.date(sixMonthsAgo, now),
    });

    // 1-2 addresses per user
    const addressCount = rng.int(1, 2);
    for (let a = 0; a < addressCount; a++) {
      const cityData = rng.pick(CITIES);
      addresses.push({
        id: rng.uuid(),
        userId,
        type: a === 0 ? 'shipping' : 'billing',
        firstName,
        lastName,
        company: rng.bool(0.2) ? `${lastName} Corp` : null,
        addressLine1: `${rng.int(100, 9999)} ${rng.pick(STREETS)}`,
        addressLine2: rng.bool(0.3) ? `Apt ${rng.int(1, 500)}` : null,
        city: cityData.city,
        state: cityData.state,
        postalCode: String(rng.int(10000, 99999)),
        country: cityData.country,
        phone: rng.bool(0.7) ? `+1${rng.int(200, 999)}${rng.int(100, 999)}${rng.int(1000, 9999)}` : null,
        isDefault: a === 0,
        createdAt: rng.date(oneYearAgo, now),
        updatedAt: rng.date(sixMonthsAgo, now),
      });
    }
  }

  // Generate 2000 orders
  const orders: Order[] = [];
  const orderItems: OrderItem[] = [];

  for (let i = 0; i < 2000; i++) {
    const orderId = rng.uuid();
    const user = rng.pick(users);
    const userAddresses = addresses.filter(a => a.userId === user.id);
    const shippingAddr = userAddresses.find(a => a.type === 'shipping') || userAddresses[0];
    const billingAddr = userAddresses.find(a => a.type === 'billing') || shippingAddr;
    const itemCount = rng.int(1, 5);
    const orderVariants = rng.pickMultiple(variants, itemCount);

    let subtotal = 0;
    const items: OrderItem[] = [];

    orderVariants.forEach((variant, idx) => {
      const product = products.find(p => p.id === variant.productId)!;
      const quantity = rng.int(1, 3);
      const totalPrice = variant.price * quantity;
      subtotal += totalPrice;

      items.push({
        id: rng.uuid(),
        orderId,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity,
        unitPrice: variant.price,
        totalPrice,
        taxAmount: totalPrice * 0.08,
        discountAmount: 0,
        imageUrl: variant.imageUrl,
        createdAt: rng.date(oneYearAgo, now),
      });
    });

    const taxTotal = subtotal * 0.08;
    const shippingTotal = subtotal > 50 ? 0 : 9.99;
    const discountTotal = rng.bool(0.2) ? subtotal * rng.decimal(0.05, 0.2) : 0;

    const statuses: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentStatuses: Order['paymentStatus'][] = ['pending', 'captured'];
    const fulfillmentStatuses: Order['fulfillmentStatus'][] = ['unfulfilled', 'fulfilled'];

    orders.push({
      id: orderId,
      orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
      userId: user.id,
      email: user.email,
      phone: shippingAddr.phone,
      status: rng.pick(statuses),
      paymentStatus: rng.pick(paymentStatuses),
      fulfillmentStatus: rng.pick(fulfillmentStatuses),
      shippingAddress: {
        id: shippingAddr.id,
        userId: shippingAddr.userId,
        type: shippingAddr.type,
        firstName: shippingAddr.firstName,
        lastName: shippingAddr.lastName,
        company: shippingAddr.company,
        addressLine1: shippingAddr.addressLine1,
        addressLine2: shippingAddr.addressLine2,
        city: shippingAddr.city,
        state: shippingAddr.state,
        postalCode: shippingAddr.postalCode,
        country: shippingAddr.country,
        phone: shippingAddr.phone,
        isDefault: shippingAddr.isDefault,
        createdAt: shippingAddr.createdAt,
        updatedAt: shippingAddr.updatedAt,
      },
      billingAddress: {
        id: billingAddr.id,
        userId: billingAddr.userId,
        type: billingAddr.type,
        firstName: billingAddr.firstName,
        lastName: billingAddr.lastName,
        company: billingAddr.company,
        addressLine1: billingAddr.addressLine1,
        addressLine2: billingAddr.addressLine2,
        city: billingAddr.city,
        state: billingAddr.state,
        postalCode: billingAddr.postalCode,
        country: billingAddr.country,
        phone: billingAddr.phone,
        isDefault: billingAddr.isDefault,
        createdAt: billingAddr.createdAt,
        updatedAt: billingAddr.updatedAt,
      },
      items,
      currency: user.currency,
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      shippingTotal,
      total: Number((subtotal + taxTotal + shippingTotal - discountTotal).toFixed(2)),
      notes: rng.bool(0.1) ? 'Please leave at door' : null,
      metadata: {},
      createdAt: rng.date(oneYearAgo, now),
      updatedAt: rng.date(sixMonthsAgo, now),
    });

    orderItems.push(...items);
  }

  // Generate reviews (avg 3 per product = 3000 reviews)
  const reviews: Review[] = [];
  products.forEach(product => {
    const reviewCount = rng.int(0, 8);
    for (let r = 0; r < reviewCount; r++) {
      const user = rng.pick(users);
      const rating = rng.int(1, 5) as 1 | 2 | 3 | 4 | 5;
      const isPositive = rating >= 4;

      reviews.push({
        id: rng.uuid(),
        productId: product.id,
        userId: user.id,
        orderId: rng.bool(0.7) ? rng.pick(orders).id : null,
        rating,
        title: rng.pick(isPositive ? REVIEW_TITLES_POSITIVE : REVIEW_TITLES_NEGATIVE),
        content: rng.pick(REVIEW_CONTENT),
        pros: isPositive ? rng.pickMultiple(PROS, rng.int(1, 3)) : [],
        cons: !isPositive ? rng.pickMultiple(CONS, rng.int(1, 3)) : [],
        verifiedPurchase: rng.bool(0.7),
        helpfulCount: rng.int(0, 50),
        status: rng.bool(0.9) ? 'approved' : 'pending',
        createdAt: rng.date(sixMonthsAgo, now),
        updatedAt: rng.date(sixMonthsAgo, now),
      });
    }
  });

  // Generate wishlists
  const wishlists: Wishlist[] = [];
  const wishlistItems: WishlistItem[] = [];

  users.slice(0, 200).forEach(user => {
    const wishlistId = rng.uuid();
    wishlists.push({
      id: wishlistId,
      userId: user.id,
      name: 'My Wishlist',
      isPublic: rng.bool(0.3),
      items: [],
      createdAt: rng.date(sixMonthsAgo, now),
      updatedAt: now,
    });

    const itemCount = rng.int(1, 10);
    const wishlistProducts = rng.pickMultiple(products, itemCount);
    wishlistProducts.forEach(product => {
      const variant = variants.find(v => v.productId === product.id);
      wishlistItems.push({
        id: rng.uuid(),
        wishlistId,
        productId: product.id,
        variantId: variant?.id || null,
        addedAt: rng.date(sixMonthsAgo, now),
        note: rng.bool(0.1) ? 'Gift idea' : null,
      });
    });
  });

  // Generate coupons
  const coupons: Coupon[] = [
    {
      id: rng.uuid(),
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off your first order',
      discountType: 'percentage',
      discountValue: 10,
      minimumPurchase: 50,
      maximumDiscount: 100,
      usageLimit: null,
      usageLimitPerUser: 1,
      usageCount: rng.int(100, 500),
      applicableProducts: null,
      applicableCategories: null,
      excludedProducts: null,
      startsAt: oneYearAgo,
      expiresAt: null,
      isActive: true,
      createdAt: oneYearAgo,
      updatedAt: now,
    },
    {
      id: rng.uuid(),
      code: 'SAVE20',
      name: 'Save $20',
      description: '$20 off orders over $100',
      discountType: 'fixed',
      discountValue: 20,
      minimumPurchase: 100,
      maximumDiscount: null,
      usageLimit: 1000,
      usageLimitPerUser: 2,
      usageCount: rng.int(50, 200),
      applicableProducts: null,
      applicableCategories: null,
      excludedProducts: null,
      startsAt: sixMonthsAgo,
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: sixMonthsAgo,
      updatedAt: now,
    },
    {
      id: rng.uuid(),
      code: 'FREESHIP',
      name: 'Free Shipping',
      description: 'Free shipping on all orders',
      discountType: 'free_shipping',
      discountValue: 0,
      minimumPurchase: 25,
      maximumDiscount: null,
      usageLimit: null,
      usageLimitPerUser: null,
      usageCount: rng.int(200, 800),
      applicableProducts: null,
      applicableCategories: null,
      excludedProducts: null,
      startsAt: oneYearAgo,
      expiresAt: null,
      isActive: true,
      createdAt: oneYearAgo,
      updatedAt: now,
    },
  ];

  // Generate promotions
  const promotions: Promotion[] = [
    {
      id: rng.uuid(),
      name: 'Summer Sale',
      description: '15% off all electronics',
      type: 'sale',
      rules: [
        {
          condition: { type: 'category', operator: 'in', value: categories.filter(c => c.name === 'Electronics').map(c => c.id) },
          action: { type: 'percentage_off', value: 15 },
        },
      ],
      priority: 1,
      stackable: false,
      startsAt: sixMonthsAgo,
      endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: sixMonthsAgo,
      updatedAt: now,
    },
    {
      id: rng.uuid(),
      name: 'Buy 2 Get 1 Free',
      description: 'Buy any 2 accessories, get 1 free',
      type: 'bogo',
      rules: [
        {
          condition: { type: 'category', operator: 'in', value: categories.filter(c => c.name === 'Accessories').map(c => c.id) },
          action: { type: 'free_item', value: 1 },
        },
      ],
      priority: 2,
      stackable: true,
      startsAt: now,
      endsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Simple app data
  const features: Feature[] = [
    { id: rng.uuid(), icon: 'zap', title: 'Lightning Fast', description: 'Optimized for speed with cutting-edge technology' },
    { id: rng.uuid(), icon: 'shield', title: 'Secure by Default', description: 'Enterprise-grade security built into every layer' },
    { id: rng.uuid(), icon: 'globe', title: 'Global Scale', description: 'Deployed across 50+ regions worldwide' },
    { id: rng.uuid(), icon: 'code', title: 'Developer First', description: 'APIs and SDKs for every major platform' },
    { id: rng.uuid(), icon: 'users', title: 'Team Collaboration', description: 'Built for teams of any size' },
    { id: rng.uuid(), icon: 'trending-up', title: 'Analytics', description: 'Real-time insights and reporting' },
  ];

  const pricingPlans: PricingPlan[] = [
    {
      id: rng.uuid(),
      name: 'Starter',
      price: 0,
      interval: 'month',
      features: ['Up to 3 projects', '1GB storage', 'Community support', 'Basic analytics'],
      highlighted: false,
      ctaText: 'Get Started Free',
    },
    {
      id: rng.uuid(),
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team members'],
      highlighted: true,
      ctaText: 'Start Free Trial',
    },
    {
      id: rng.uuid(),
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: ['Everything in Pro', 'Unlimited storage', 'Dedicated support', 'SLA guarantee', 'SSO/SAML', 'Custom integrations', 'On-premise option'],
      highlighted: false,
      ctaText: 'Contact Sales',
    },
  ];

  const testimonials: Testimonial[] = [
    { id: rng.uuid(), author: 'Sarah Chen', role: 'CTO', company: 'TechCorp', content: 'This platform has transformed how we build and deploy applications. The performance gains alone justified the switch.', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', rating: 5 },
    { id: rng.uuid(), author: 'Michael Roberts', role: 'Lead Developer', company: 'StartupX', content: 'The developer experience is unmatched. We shipped our MVP in half the time we expected.', avatarUrl: 'https://i.pravatar.cc/150?u=michael', rating: 5 },
    { id: rng.uuid(), author: 'Emily Watson', role: 'Engineering Manager', company: 'ScaleUp Inc', content: 'Excellent documentation and support. Our team was productive from day one.', avatarUrl: 'https://i.pravatar.cc/150?u=emily', rating: 4 },
    { id: rng.uuid(), author: 'David Kim', role: 'Founder', company: 'Innovate Labs', content: 'The best investment we made this year. ROI was visible within the first month.', avatarUrl: 'https://i.pravatar.cc/150?u=david', rating: 5 },
  ];

  const faqs: FAQ[] = [
    { id: rng.uuid(), question: 'How do I get started?', answer: 'Sign up for a free account and follow our quick start guide. You\'ll be up and running in under 5 minutes.', category: 'Getting Started' },
    { id: rng.uuid(), question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and wire transfers for enterprise customers.', category: 'Billing' },
    { id: rng.uuid(), question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.', category: 'Billing' },
    { id: rng.uuid(), question: 'Is there a free trial?', answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required.', category: 'Getting Started' },
    { id: rng.uuid(), question: 'What kind of support do you offer?', answer: 'We offer email support for all plans, priority support for Pro plans, and dedicated support for Enterprise customers.', category: 'Support' },
    { id: rng.uuid(), question: 'Do you offer refunds?', answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans.', category: 'Billing' },
  ];

  return {
    users,
    categories,
    brands,
    products,
    variants,
    inventory,
    addresses,
    orders,
    orderItems,
    reviews,
    wishlists,
    wishlistItems,
    coupons,
    promotions,
    features,
    pricingPlans,
    testimonials,
    faqs,
  };
}

// CLI usage
if (typeof process !== 'undefined' && process.argv[1]?.includes('generator')) {
  const data = generateSeedData();
  console.log(JSON.stringify(data, null, 2));
}

export { SeededRandom };
