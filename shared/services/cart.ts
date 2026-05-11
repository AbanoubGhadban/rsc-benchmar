// Cart service - data access layer for shopping cart
// Used across all framework implementations

import { query, queryOne, queryMany, transaction } from '../db/client';
import type { Cart, CartItem, ProductVariant, Product, AppliedCoupon } from '../types';

interface CartRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  currency: string;
  locale: string;
  applied_coupons: AppliedCoupon[];
  subtotal: string;
  discount_total: string;
  tax_total: string;
  shipping_total: string;
  total: string;
  created_at: Date;
  updated_at: Date;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  product_id?: string;
  product_name?: string;
  product_slug?: string;
  product_featured_image_url?: string | null;
  variant_name?: string;
  variant_sku?: string;
  variant_image_url?: string | null;
  variant_options?: { name: string; value: string }[];
}

function rowToCart(row: CartRow): Omit<Cart, 'items'> {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    shippingAddressId: row.shipping_address_id,
    billingAddressId: row.billing_address_id,
    currency: row.currency as Cart['currency'],
    locale: row.locale as Cart['locale'],
    appliedCoupons: row.applied_coupons || [],
    subtotal: parseFloat(row.subtotal),
    discountTotal: parseFloat(row.discount_total),
    taxTotal: parseFloat(row.tax_total),
    shippingTotal: parseFloat(row.shipping_total),
    total: parseFloat(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [],
  };
}

function rowToCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    cartId: row.cart_id,
    variantId: row.variant_id,
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    totalPrice: parseFloat(row.total_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: {
      id: row.product_id!,
      name: row.product_name!,
      slug: row.product_slug!,
      featuredImageUrl: row.product_featured_image_url || null,
    } as Product,
    variant: {
      id: row.variant_id,
      name: row.variant_name!,
      sku: row.variant_sku!,
      imageUrl: row.variant_image_url || null,
      options: row.variant_options || [],
    } as ProductVariant,
  };
}

export async function getCartByUserId(userId: string): Promise<Cart | null> {
  const cartRow = await queryOne<CartRow>(
    `SELECT * FROM carts WHERE user_id = $1`,
    [userId]
  );

  if (!cartRow) return null;

  const items = await getCartItems(cartRow.id);
  return { ...rowToCart(cartRow), items };
}

export async function getCartBySessionId(sessionId: string): Promise<Cart | null> {
  const cartRow = await queryOne<CartRow>(
    `SELECT * FROM carts WHERE session_id = $1 AND user_id IS NULL`,
    [sessionId]
  );

  if (!cartRow) return null;

  const items = await getCartItems(cartRow.id);
  return { ...rowToCart(cartRow), items };
}

export async function getOrCreateCart(
  userId: string | null,
  sessionId: string
): Promise<Cart> {
  // Try to find existing cart
  let cart: Cart | null = null;

  if (userId) {
    cart = await getCartByUserId(userId);
  }

  if (!cart) {
    cart = await getCartBySessionId(sessionId);
  }

  if (cart) return cart;

  // Create new cart
  const cartRow = await queryOne<CartRow>(
    `INSERT INTO carts (user_id, session_id, currency, locale)
     VALUES ($1, $2, 'USD', 'en-US')
     RETURNING *`,
    [userId, sessionId]
  );

  return { ...rowToCart(cartRow!), items: [] };
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const rows = await queryMany<CartItemRow>(
    `SELECT
       ci.*,
       p.id as product_id,
       p.name as product_name,
       p.slug as product_slug,
       p.featured_image_url as product_featured_image_url,
       v.name as variant_name,
       v.sku as variant_sku,
       v.image_url as variant_image_url,
       v.options as variant_options
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at`,
    [cartId]
  );

  return rows.map(rowToCartItem);
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<Cart> {
  return transaction(async ({ query, queryOne }) => {
    // Get variant price
    const variant = await queryOne<{ price: string }>(
      `SELECT price FROM product_variants WHERE id = $1`,
      [variantId]
    );

    if (!variant) {
      throw new Error('Variant not found');
    }

    const unitPrice = parseFloat(variant.price);
    const totalPrice = unitPrice * quantity;

    // Check if item already in cart
    const existing = await queryOne<{ id: string; quantity: number }>(
      `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2`,
      [cartId, variantId]
    );

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      await query(
        `UPDATE cart_items
         SET quantity = $1, total_price = $2, updated_at = NOW()
         WHERE id = $3`,
        [newQuantity, unitPrice * newQuantity, existing.id]
      );
    } else {
      await query(
        `INSERT INTO cart_items (cart_id, variant_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [cartId, variantId, quantity, unitPrice, totalPrice]
      );
    }

    // Recalculate cart totals
    await recalculateCart(cartId);

    // Return updated cart
    const cart = await getCartById(cartId);
    return cart!;
  });
}

export async function updateCartItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  return transaction(async ({ query, queryOne }) => {
    if (quantity <= 0) {
      await query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`, [itemId, cartId]);
    } else {
      const item = await queryOne<{ unit_price: string }>(
        `SELECT unit_price FROM cart_items WHERE id = $1 AND cart_id = $2`,
        [itemId, cartId]
      );

      if (item) {
        const totalPrice = parseFloat(item.unit_price) * quantity;
        await query(
          `UPDATE cart_items
           SET quantity = $1, total_price = $2, updated_at = NOW()
           WHERE id = $3`,
          [quantity, totalPrice, itemId]
        );
      }
    }

    await recalculateCart(cartId);
    const cart = await getCartById(cartId);
    return cart!;
  });
}

export async function removeFromCart(cartId: string, itemId: string): Promise<Cart> {
  await query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`, [itemId, cartId]);
  await recalculateCart(cartId);
  const cart = await getCartById(cartId);
  return cart!;
}

export async function clearCart(cartId: string): Promise<Cart> {
  await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
  await recalculateCart(cartId);
  const cart = await getCartById(cartId);
  return cart!;
}

export async function applyCoupon(cartId: string, code: string): Promise<{
  success: boolean;
  cart?: Cart;
  error?: string;
}> {
  return transaction(async ({ query, queryOne }) => {
    // Validate coupon
    const coupon = await queryOne<{
      id: string;
      code: string;
      discount_type: string;
      discount_value: string;
      minimum_purchase: string | null;
      maximum_discount: string | null;
      usage_limit: number | null;
      usage_count: number;
      is_active: boolean;
      starts_at: Date;
      expires_at: Date | null;
    }>(
      `SELECT * FROM coupons WHERE code = $1`,
      [code.toUpperCase()]
    );

    if (!coupon) {
      return { success: false, error: 'Invalid coupon code' };
    }

    if (!coupon.is_active) {
      return { success: false, error: 'Coupon is not active' };
    }

    const now = new Date();
    if (now < coupon.starts_at) {
      return { success: false, error: 'Coupon is not yet valid' };
    }

    if (coupon.expires_at && now > coupon.expires_at) {
      return { success: false, error: 'Coupon has expired' };
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { success: false, error: 'Coupon usage limit reached' };
    }

    // Get current cart
    const cartRow = await queryOne<CartRow>(`SELECT * FROM carts WHERE id = $1`, [cartId]);
    if (!cartRow) {
      return { success: false, error: 'Cart not found' };
    }

    const subtotal = parseFloat(cartRow.subtotal);
    const minimumPurchase = coupon.minimum_purchase ? parseFloat(coupon.minimum_purchase) : 0;

    if (subtotal < minimumPurchase) {
      return { success: false, error: `Minimum purchase of $${minimumPurchase} required` };
    }

    // Check if coupon already applied
    const appliedCoupons: AppliedCoupon[] = cartRow.applied_coupons || [];
    if (appliedCoupons.some(c => c.code === coupon.code)) {
      return { success: false, error: 'Coupon already applied' };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = parseFloat(coupon.discount_value);
    }

    // Apply maximum discount cap
    if (coupon.maximum_discount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.maximum_discount));
    }

    // Add coupon to cart
    appliedCoupons.push({
      code: coupon.code,
      discountAmount,
      discountType: coupon.discount_type as 'percentage' | 'fixed',
    });

    await query(
      `UPDATE carts SET applied_coupons = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(appliedCoupons), cartId]
    );

    // Increment usage count
    await query(
      `UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1`,
      [coupon.id]
    );

    await recalculateCart(cartId);
    const cart = await getCartById(cartId);

    return { success: true, cart: cart! };
  });
}

export async function removeCoupon(cartId: string, code: string): Promise<Cart> {
  const cartRow = await queryOne<CartRow>(`SELECT * FROM carts WHERE id = $1`, [cartId]);
  if (!cartRow) throw new Error('Cart not found');

  const appliedCoupons = (cartRow.applied_coupons || []).filter(
    c => c.code !== code.toUpperCase()
  );

  await query(
    `UPDATE carts SET applied_coupons = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(appliedCoupons), cartId]
  );

  await recalculateCart(cartId);
  const cart = await getCartById(cartId);
  return cart!;
}

async function recalculateCart(cartId: string): Promise<void> {
  const items = await getCartItems(cartId);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const cartRow = await queryOne<CartRow>(`SELECT * FROM carts WHERE id = $1`, [cartId]);
  if (!cartRow) return;

  const appliedCoupons = cartRow.applied_coupons || [];
  const discountTotal = appliedCoupons.reduce((sum, c) => sum + c.discountAmount, 0);

  // Simple tax calculation (8%)
  const taxTotal = (subtotal - discountTotal) * 0.08;

  // Simple shipping calculation
  const shippingTotal = subtotal > 50 ? 0 : 9.99;

  const total = subtotal - discountTotal + taxTotal + shippingTotal;

  await query(
    `UPDATE carts
     SET subtotal = $1, discount_total = $2, tax_total = $3, shipping_total = $4, total = $5, updated_at = NOW()
     WHERE id = $6`,
    [subtotal.toFixed(2), discountTotal.toFixed(2), taxTotal.toFixed(2), shippingTotal.toFixed(2), total.toFixed(2), cartId]
  );
}

export async function getCartById(cartId: string): Promise<Cart | null> {
  const cartRow = await queryOne<CartRow>(`SELECT * FROM carts WHERE id = $1`, [cartId]);
  if (!cartRow) return null;

  const items = await getCartItems(cartId);
  return { ...rowToCart(cartRow), items };
}

export async function mergeGuestCartToUser(
  guestSessionId: string,
  userId: string
): Promise<Cart> {
  return transaction(async ({ query, queryOne, queryMany }) => {
    const guestCart = await getCartBySessionId(guestSessionId);
    let userCart = await getCartByUserId(userId);

    if (!guestCart) {
      if (!userCart) {
        // Create new cart for user
        const cartRow = await queryOne<CartRow>(
          `INSERT INTO carts (user_id, currency, locale)
           VALUES ($1, 'USD', 'en-US')
           RETURNING *`,
          [userId]
        );
        return { ...rowToCart(cartRow!), items: [] };
      }
      return userCart;
    }

    if (!userCart) {
      // Transfer guest cart to user
      await query(
        `UPDATE carts SET user_id = $1, session_id = NULL, updated_at = NOW() WHERE id = $2`,
        [userId, guestCart.id]
      );
      const cart = await getCartById(guestCart.id);
      return cart!;
    }

    // Merge: add guest items to user cart
    for (const item of guestCart.items) {
      const existing = userCart.items.find(i => i.variantId === item.variantId);
      if (existing) {
        await query(
          `UPDATE cart_items
           SET quantity = quantity + $1, total_price = total_price + $2, updated_at = NOW()
           WHERE id = $3`,
          [item.quantity, item.totalPrice, existing.id]
        );
      } else {
        await query(
          `INSERT INTO cart_items (cart_id, variant_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [userCart.id, item.variantId, item.quantity, item.unitPrice, item.totalPrice]
        );
      }
    }

    // Delete guest cart
    await query(`DELETE FROM carts WHERE id = $1`, [guestCart.id]);

    // Recalculate user cart
    await recalculateCart(userCart.id);
    const cart = await getCartById(userCart.id);
    return cart!;
  });
}

export async function getCartItemCount(
  userId: string | null,
  sessionId: string
): Promise<number> {
  let cart: Cart | null = null;

  if (userId) {
    cart = await getCartByUserId(userId);
  }

  if (!cart) {
    cart = await getCartBySessionId(sessionId);
  }

  if (!cart) return 0;

  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
