// User service - data access layer for users and auth
// Used across all framework implementations

import { query, queryOne, queryMany } from '../db/client';
import type { User, Session, Address, Wishlist, WishlistItem, Order } from '../types';
import * as crypto from 'crypto';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  locale: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

interface AddressRow {
  id: string;
  user_id: string | null;
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

interface WishlistRow {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    locale: row.locale as User['locale'],
    currency: row.currency as User['currency'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function rowToAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Users
export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return row ? rowToUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return row ? rowToUser(row) : null;
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<User> {
  const passwordHash = hashPassword(data.password);

  const row = await queryOne<UserRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.email.toLowerCase(), passwordHash, data.firstName, data.lastName]
  );

  return rowToUser(row!);
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'locale' | 'currency'>>
): Promise<User | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.firstName !== undefined) {
    updates.push(`first_name = $${paramIndex++}`);
    params.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push(`last_name = $${paramIndex++}`);
    params.push(data.lastName);
  }
  if (data.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    params.push(data.avatarUrl);
  }
  if (data.locale !== undefined) {
    updates.push(`locale = $${paramIndex++}`);
    params.push(data.locale);
  }
  if (data.currency !== undefined) {
    updates.push(`currency = $${paramIndex++}`);
    params.push(data.currency);
  }

  if (updates.length === 0) return getUserById(id);

  params.push(id);
  const row = await queryOne<UserRow>(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return row ? rowToUser(row) : null;
}

export async function updatePassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = hashPassword(newPassword);
  const result = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, id]
  );
  return (result.rowCount || 0) > 0;
}

// Sessions
export async function createSession(userId: string): Promise<Session> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const row = await queryOne<SessionRow>(
    `INSERT INTO sessions (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, token, expiresAt]
  );

  return rowToSession(row!);
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const row = await queryOne<SessionRow>(
    `SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  return row ? rowToSession(row) : null;
}

export async function getUserBySessionToken(token: string): Promise<User | null> {
  const session = await getSessionByToken(token);
  if (!session) return null;
  return getUserById(session.userId);
}

export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}

export async function cleanExpiredSessions(): Promise<number> {
  const result = await query(`DELETE FROM sessions WHERE expires_at < NOW()`);
  return result.rowCount || 0;
}

// Authentication
export async function authenticate(
  email: string,
  password: string
): Promise<{ user: User; session: Session } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  if (!verifyPassword(password, user.passwordHash)) return null;

  const session = await createSession(user.id);
  return { user, session };
}

// Addresses
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const rows = await queryMany<AddressRow>(
    `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows.map(rowToAddress);
}

export async function getAddressById(id: string): Promise<Address | null> {
  const row = await queryOne<AddressRow>(`SELECT * FROM addresses WHERE id = $1`, [id]);
  return row ? rowToAddress(row) : null;
}

export async function createAddress(
  userId: string,
  data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Address> {
  // If this is the first address or marked as default, unset other defaults
  if (data.isDefault) {
    await query(
      `UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2`,
      [userId, data.type]
    );
  }

  const row = await queryOne<AddressRow>(
    `INSERT INTO addresses (
       user_id, type, first_name, last_name, company,
       address_line1, address_line2, city, state, postal_code,
       country, phone, is_default
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      userId,
      data.type,
      data.firstName,
      data.lastName,
      data.company,
      data.addressLine1,
      data.addressLine2,
      data.city,
      data.state,
      data.postalCode,
      data.country,
      data.phone,
      data.isDefault,
    ]
  );

  return rowToAddress(row!);
}

export async function updateAddress(
  id: string,
  data: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<Address | null> {
  const address = await getAddressById(id);
  if (!address) return null;

  if (data.isDefault && address.userId) {
    await query(
      `UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2 AND id != $3`,
      [address.userId, data.type || address.type, id]
    );
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const fields: (keyof typeof data)[] = [
    'type', 'firstName', 'lastName', 'company', 'addressLine1',
    'addressLine2', 'city', 'state', 'postalCode', 'country', 'phone', 'isDefault'
  ];

  const fieldMap: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    postalCode: 'postal_code',
    isDefault: 'is_default',
  };

  for (const field of fields) {
    if (data[field] !== undefined) {
      const dbField = fieldMap[field] || field;
      updates.push(`${dbField} = $${paramIndex++}`);
      params.push(data[field]);
    }
  }

  if (updates.length === 0) return address;

  params.push(id);
  const row = await queryOne<AddressRow>(
    `UPDATE addresses SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return row ? rowToAddress(row) : null;
}

export async function deleteAddress(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM addresses WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

// Wishlists
export async function getUserWishlists(userId: string): Promise<Wishlist[]> {
  const rows = await queryMany<WishlistRow>(
    `SELECT * FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const wishlists: Wishlist[] = [];
  for (const row of rows) {
    const items = await getWishlistItems(row.id);
    wishlists.push({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      isPublic: row.is_public,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return wishlists;
}

export async function getWishlistItems(wishlistId: string): Promise<WishlistItem[]> {
  const rows = await queryMany<{
    id: string;
    wishlist_id: string;
    product_id: string;
    variant_id: string | null;
    added_at: Date;
    note: string | null;
  }>(
    `SELECT * FROM wishlist_items WHERE wishlist_id = $1 ORDER BY added_at DESC`,
    [wishlistId]
  );

  return rows.map(row => ({
    id: row.id,
    wishlistId: row.wishlist_id,
    productId: row.product_id,
    variantId: row.variant_id,
    addedAt: row.added_at,
    note: row.note,
  }));
}

export async function addToWishlist(
  userId: string,
  productId: string,
  variantId?: string,
  note?: string
): Promise<WishlistItem> {
  // Get or create default wishlist
  let wishlist = await queryOne<WishlistRow>(
    `SELECT * FROM wishlists WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (!wishlist) {
    wishlist = await queryOne<WishlistRow>(
      `INSERT INTO wishlists (user_id, name) VALUES ($1, 'My Wishlist') RETURNING *`,
      [userId]
    );
  }

  const row = await queryOne<{
    id: string;
    wishlist_id: string;
    product_id: string;
    variant_id: string | null;
    added_at: Date;
    note: string | null;
  }>(
    `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id, note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wishlist_id, product_id, variant_id) DO UPDATE SET note = $4
     RETURNING *`,
    [wishlist!.id, productId, variantId || null, note || null]
  );

  return {
    id: row!.id,
    wishlistId: row!.wishlist_id,
    productId: row!.product_id,
    variantId: row!.variant_id,
    addedAt: row!.added_at,
    note: row!.note,
  };
}

export async function removeFromWishlist(userId: string, productId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM wishlist_items
     WHERE product_id = $1 AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $2)`,
    [productId, userId]
  );
  return (result.rowCount || 0) > 0;
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM wishlist_items wi
       JOIN wishlists w ON w.id = wi.wishlist_id
       WHERE w.user_id = $1 AND wi.product_id = $2
     ) as exists`,
    [userId, productId]
  );
  return row?.exists || false;
}

// Order history
export async function getUserOrders(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ orders: Order[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [countResult, ordersResult] = await Promise.all([
    queryOne<{ total: string }>(`SELECT COUNT(*) as total FROM orders WHERE user_id = $1`, [userId]),
    queryMany<{
      id: string;
      order_number: string;
      status: string;
      total: string;
      created_at: Date;
    }>(
      `SELECT id, order_number, status, total, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    ),
  ]);

  return {
    orders: ordersResult as unknown as Order[],
    total: parseInt(countResult?.total || '0', 10),
  };
}
