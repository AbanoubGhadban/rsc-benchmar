// Seed database with generated data
// Run: npm run db:seed

import { getPool, closePool } from '../db/client';
import { generateSeedData } from './generator';

async function seed() {
  console.log('Generating seed data...');
  const data = generateSeedData(42);

  console.log(`Generated:
  - ${data.users.length} users
  - ${data.categories.length} categories
  - ${data.brands.length} brands
  - ${data.products.length} products
  - ${data.variants.length} variants
  - ${data.orders.length} orders
  - ${data.reviews.length} reviews
  - ${data.wishlists.length} wishlists
  - ${data.coupons.length} coupons
  - ${data.promotions.length} promotions
  - ${data.features.length} features (landing page)
  - ${data.pricingPlans.length} pricing plans (landing page)
  - ${data.testimonials.length} testimonials (landing page)
  - ${data.faqs.length} FAQs (landing page)
`);

  const pool = getPool();

  try {
    console.log('Clearing existing data...');
    await pool.query('TRUNCATE TABLE contact_form_submissions, faqs, testimonials, pricing_plans, features, landing_page_sections CASCADE');
    await pool.query('TRUNCATE TABLE search_queries, product_views CASCADE');
    await pool.query('TRUNCATE TABLE refunds, payment_intents, payment_methods CASCADE');
    await pool.query('TRUNCATE TABLE shipping_methods, shipping_zones CASCADE');
    await pool.query('TRUNCATE TABLE tax_rates CASCADE');
    await pool.query('TRUNCATE TABLE translations, currency_rates CASCADE');
    await pool.query('TRUNCATE TABLE wishlist_items, wishlists CASCADE');
    await pool.query('TRUNCATE TABLE promotions, coupons CASCADE');
    await pool.query('TRUNCATE TABLE review_helpful, review_images, reviews CASCADE');
    await pool.query('TRUNCATE TABLE order_items, orders CASCADE');
    await pool.query('TRUNCATE TABLE cart_items, carts CASCADE');
    await pool.query('TRUNCATE TABLE addresses CASCADE');
    await pool.query('TRUNCATE TABLE stock_movements, inventory_items CASCADE');
    await pool.query('TRUNCATE TABLE product_images, product_variants, products CASCADE');
    await pool.query('TRUNCATE TABLE categories, brands, tax_classes CASCADE');
    await pool.query('TRUNCATE TABLE oauth_accounts, sessions, users CASCADE');
    await pool.query('TRUNCATE TABLE inventory_locations CASCADE');

    console.log('Inserting users...');
    for (const user of data.users) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, role, locale, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [user.id, user.email, 'seed:hash', user.firstName, user.lastName, user.avatarUrl, user.role, user.locale, user.currency, user.createdAt, user.updatedAt]
      );
    }
    console.log(`  ✓ ${data.users.length} users`);

    console.log('Inserting categories...');
    for (const cat of data.categories) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, description, parent_id, image_url, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [cat.id, cat.name, cat.slug, cat.description, cat.parentId, cat.imageUrl, cat.position, cat.createdAt, cat.updatedAt]
      );
    }
    console.log(`  ✓ ${data.categories.length} categories`);

    console.log('Inserting brands...');
    for (const brand of data.brands) {
      await pool.query(
        `INSERT INTO brands (id, name, slug, logo_url, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [brand.id, brand.name, brand.slug, brand.logoUrl, brand.description, brand.createdAt]
      );
    }
    console.log(`  ✓ ${data.brands.length} brands`);

    console.log('Inserting inventory location...');
    const locationId = data.inventory[0]?.locationId || '00000000-0000-4000-8000-000000000001';
    await pool.query(
      `INSERT INTO inventory_locations (id, name, address_line1, city, postal_code, country, is_default, is_active)
       VALUES ($1, 'Main Warehouse', '123 Warehouse St', 'Los Angeles', '90001', 'US', true, true)`,
      [locationId]
    );
    console.log(`  ✓ 1 inventory location`);

    console.log('Inserting products...');
    for (const product of data.products) {
      await pool.query(
        `INSERT INTO products (id, sku, name, slug, description, short_description, category_id, brand_id, base_price, compare_at_price, cost_price, taxable, weight, weight_unit, status, featured_image_url, meta_title, meta_description, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [product.id, product.sku, product.name, product.slug, product.description, product.shortDescription, product.categoryId, product.brandId, product.basePrice, product.compareAtPrice, product.costPrice, product.taxable, product.weight, product.weightUnit, product.status, product.featuredImageUrl, product.metaTitle, product.metaDescription, product.tags, product.createdAt, product.updatedAt]
      );
    }
    console.log(`  ✓ ${data.products.length} products`);

    console.log('Inserting variants...');
    for (const variant of data.variants) {
      await pool.query(
        `INSERT INTO product_variants (id, product_id, sku, name, price, compare_at_price, cost_price, weight, options, image_url, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [variant.id, variant.productId, variant.sku, variant.name, variant.price, variant.compareAtPrice, variant.costPrice, variant.weight, JSON.stringify(variant.options), variant.imageUrl, variant.position, variant.createdAt, variant.updatedAt]
      );
    }
    console.log(`  ✓ ${data.variants.length} variants`);

    console.log('Inserting inventory...');
    for (const inv of data.inventory) {
      await pool.query(
        `INSERT INTO inventory_items (id, variant_id, location_id, quantity, reserved_quantity, low_stock_threshold, track_inventory, allow_backorder, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [inv.id, inv.variantId, inv.locationId, inv.quantity, inv.reservedQuantity, inv.lowStockThreshold, inv.trackInventory, inv.allowBackorder, inv.updatedAt]
      );
    }
    console.log(`  ✓ ${data.inventory.length} inventory items`);

    console.log('Inserting addresses...');
    for (const addr of data.addresses) {
      await pool.query(
        `INSERT INTO addresses (id, user_id, type, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [addr.id, addr.userId, addr.type, addr.firstName, addr.lastName, addr.company, addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode, addr.country, addr.phone, addr.isDefault, addr.createdAt, addr.updatedAt]
      );
    }
    console.log(`  ✓ ${data.addresses.length} addresses`);

    console.log('Inserting orders...');
    for (const order of data.orders) {
      await pool.query(
        `INSERT INTO orders (id, order_number, user_id, email, phone, status, payment_status, fulfillment_status, shipping_address, billing_address, currency, subtotal, discount_total, tax_total, shipping_total, total, notes, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [order.id, order.orderNumber, order.userId, order.email, order.phone, order.status, order.paymentStatus, order.fulfillmentStatus, JSON.stringify(order.shippingAddress), JSON.stringify(order.billingAddress), order.currency, order.subtotal, order.discountTotal, order.taxTotal, order.shippingTotal, order.total, order.notes, JSON.stringify(order.metadata), order.createdAt, order.updatedAt]
      );
    }
    console.log(`  ✓ ${data.orders.length} orders`);

    console.log('Inserting order items...');
    for (const item of data.orderItems) {
      await pool.query(
        `INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price, tax_amount, discount_amount, image_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [item.id, item.orderId, item.variantId, item.productName, item.variantName, item.sku, item.quantity, item.unitPrice, item.totalPrice, item.taxAmount, item.discountAmount, item.imageUrl, item.createdAt]
      );
    }
    console.log(`  ✓ ${data.orderItems.length} order items`);

    console.log('Inserting reviews...');
    for (const review of data.reviews) {
      await pool.query(
        `INSERT INTO reviews (id, product_id, user_id, order_id, rating, title, content, pros, cons, verified_purchase, helpful_count, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [review.id, review.productId, review.userId, review.orderId, review.rating, review.title, review.content, review.pros, review.cons, review.verifiedPurchase, review.helpfulCount, review.status, review.createdAt, review.updatedAt]
      );
    }
    console.log(`  ✓ ${data.reviews.length} reviews`);

    console.log('Inserting wishlists...');
    for (const wishlist of data.wishlists) {
      await pool.query(
        `INSERT INTO wishlists (id, user_id, name, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [wishlist.id, wishlist.userId, wishlist.name, wishlist.isPublic, wishlist.createdAt, wishlist.updatedAt]
      );
    }
    console.log(`  ✓ ${data.wishlists.length} wishlists`);

    console.log('Inserting wishlist items...');
    for (const item of data.wishlistItems) {
      await pool.query(
        `INSERT INTO wishlist_items (id, wishlist_id, product_id, variant_id, added_at, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, item.wishlistId, item.productId, item.variantId, item.addedAt, item.note]
      );
    }
    console.log(`  ✓ ${data.wishlistItems.length} wishlist items`);

    console.log('Inserting coupons...');
    for (const coupon of data.coupons) {
      await pool.query(
        `INSERT INTO coupons (id, code, name, description, discount_type, discount_value, minimum_purchase, maximum_discount, usage_limit, usage_limit_per_user, usage_count, applicable_products, applicable_categories, excluded_products, starts_at, expires_at, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [coupon.id, coupon.code, coupon.name, coupon.description, coupon.discountType, coupon.discountValue, coupon.minimumPurchase, coupon.maximumDiscount, coupon.usageLimit, coupon.usageLimitPerUser, coupon.usageCount, coupon.applicableProducts, coupon.applicableCategories, coupon.excludedProducts, coupon.startsAt, coupon.expiresAt, coupon.isActive, coupon.createdAt, coupon.updatedAt]
      );
    }
    console.log(`  ✓ ${data.coupons.length} coupons`);

    console.log('Inserting promotions...');
    for (const promo of data.promotions) {
      await pool.query(
        `INSERT INTO promotions (id, name, description, type, rules, priority, stackable, starts_at, ends_at, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [promo.id, promo.name, promo.description, promo.type, JSON.stringify(promo.rules), promo.priority, promo.stackable, promo.startsAt, promo.endsAt, promo.isActive, promo.createdAt, promo.updatedAt]
      );
    }
    console.log(`  ✓ ${data.promotions.length} promotions`);

    // Landing page data
    console.log('Inserting landing page data...');
    for (const feature of data.features) {
      await pool.query(
        `INSERT INTO features (id, icon, title, description) VALUES ($1, $2, $3, $4)`,
        [feature.id, feature.icon, feature.title, feature.description]
      );
    }
    console.log(`  ✓ ${data.features.length} features`);

    for (const plan of data.pricingPlans) {
      await pool.query(
        `INSERT INTO pricing_plans (id, name, price, interval, features, highlighted, cta_text) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [plan.id, plan.name, plan.price, plan.interval, plan.features, plan.highlighted, plan.ctaText]
      );
    }
    console.log(`  ✓ ${data.pricingPlans.length} pricing plans`);

    for (const testimonial of data.testimonials) {
      await pool.query(
        `INSERT INTO testimonials (id, author, role, company, content, avatar_url, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [testimonial.id, testimonial.author, testimonial.role, testimonial.company, testimonial.content, testimonial.avatarUrl, testimonial.rating]
      );
    }
    console.log(`  ✓ ${data.testimonials.length} testimonials`);

    for (const faq of data.faqs) {
      await pool.query(
        `INSERT INTO faqs (id, question, answer, category) VALUES ($1, $2, $3, $4)`,
        [faq.id, faq.question, faq.answer, faq.category]
      );
    }
    console.log(`  ✓ ${data.faqs.length} FAQs`);

    // Refresh materialized view
    console.log('Refreshing product_stats materialized view...');
    await pool.query('REFRESH MATERIALIZED VIEW product_stats');
    console.log(`  ✓ product_stats refreshed`);

    console.log('\n✅ Seed complete!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
