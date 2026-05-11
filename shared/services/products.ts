// Product service - data access layer for products
// Used across all framework implementations

import { queryMany, queryOne, buildWhereClause, buildPagination, buildOrderBy } from '../db/client';
import type {
  Product,
  ProductVariant,
  Category,
  Brand,
  Review,
  ProductFilter,
  ProductSort,
  PaginatedResult,
} from '../types';

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  category_id: string;
  brand_id: string | null;
  base_price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  taxable: boolean;
  tax_class_id: string | null;
  weight: string | null;
  weight_unit: 'kg' | 'lb' | 'oz' | 'g';
  status: 'draft' | 'active' | 'archived';
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  weight: string | null;
  options: { name: string; value: string }[];
  image_url: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: Date;
}

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string;
  pros: string[];
  cons: string[];
  verified_purchase: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

interface ProductStatsRow {
  product_id: string;
  avg_rating: string;
  review_count: string;
  view_count: string;
  sold_last_30_days: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description || '',
    categoryId: row.category_id,
    brandId: row.brand_id,
    basePrice: parseFloat(row.base_price),
    compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    costPrice: row.cost_price ? parseFloat(row.cost_price) : null,
    taxable: row.taxable,
    taxClassId: row.tax_class_id,
    weight: row.weight ? parseFloat(row.weight) : null,
    weightUnit: row.weight_unit,
    status: row.status,
    featuredImageUrl: row.featured_image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    name: row.name,
    price: parseFloat(row.price),
    compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    costPrice: row.cost_price ? parseFloat(row.cost_price) : null,
    weight: row.weight ? parseFloat(row.weight) : null,
    options: row.options,
    imageUrl: row.image_url,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id,
    imageUrl: row.image_url,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    createdAt: row.created_at,
  };
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating as 1 | 2 | 3 | 4 | 5,
    title: row.title,
    content: row.content,
    pros: row.pros,
    cons: row.cons,
    verifiedPurchase: row.verified_purchase,
    helpfulCount: row.helpful_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Products
export async function getProducts(
  filter: ProductFilter = {},
  sort: ProductSort = { field: 'createdAt', direction: 'desc' },
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResult<Product & { avgRating: number; reviewCount: number }>> {
  const conditions: string[] = ["p.status = 'active'"];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.categories?.length) {
    conditions.push(`p.category_id = ANY($${paramIndex++}::uuid[])`);
    params.push(filter.categories);
  }

  if (filter.brands?.length) {
    conditions.push(`p.brand_id = ANY($${paramIndex++}::uuid[])`);
    params.push(filter.brands);
  }

  if (filter.priceMin !== undefined) {
    conditions.push(`p.base_price >= $${paramIndex++}`);
    params.push(filter.priceMin);
  }

  if (filter.priceMax !== undefined) {
    conditions.push(`p.base_price <= $${paramIndex++}`);
    params.push(filter.priceMax);
  }

  if (filter.inStock !== undefined && filter.inStock) {
    conditions.push(`EXISTS (
      SELECT 1 FROM inventory_items ii
      JOIN product_variants pv ON pv.id = ii.variant_id
      WHERE pv.product_id = p.id AND ii.quantity > 0
    )`);
  }

  if (filter.rating !== undefined) {
    conditions.push(`COALESCE(ps.avg_rating, 0) >= $${paramIndex++}`);
    params.push(filter.rating);
  }

  if (filter.tags?.length) {
    conditions.push(`p.tags && $${paramIndex++}::text[]`);
    params.push(filter.tags);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortFieldMap: Record<string, string> = {
    price: 'p.base_price',
    name: 'p.name',
    createdAt: 'p.created_at',
    rating: 'COALESCE(ps.avg_rating, 0)',
    popularity: 'COALESCE(ps.sold_last_30_days, 0)',
  };
  const sortField = sortFieldMap[sort.field] || 'p.created_at';
  const orderClause = `ORDER BY ${sortField} ${sort.direction.toUpperCase()}`;

  const { clause: paginationClause, offset } = buildPagination(page, pageSize);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    LEFT JOIN product_stats ps ON ps.product_id = p.id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      p.*,
      COALESCE(ps.avg_rating, 0) as avg_rating,
      COALESCE(ps.review_count, 0) as review_count
    FROM products p
    LEFT JOIN product_stats ps ON ps.product_id = p.id
    ${whereClause}
    ${orderClause}
    ${paginationClause}
  `;

  const [countResult, dataResult] = await Promise.all([
    queryOne<{ total: string }>(countQuery, params),
    queryMany<ProductRow & { avg_rating: string; review_count: string }>(dataQuery, params),
  ]);

  const total = parseInt(countResult?.total || '0', 10);
  const totalPages = Math.ceil(total / pageSize);

  return {
    items: dataResult.map(row => ({
      ...rowToProduct(row),
      avgRating: parseFloat(row.avg_rating),
      reviewCount: parseInt(row.review_count, 10),
    })),
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await queryOne<ProductRow>(
    `SELECT * FROM products WHERE slug = $1 AND status = 'active'`,
    [slug]
  );
  return row ? rowToProduct(row) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await queryOne<ProductRow>(
    `SELECT * FROM products WHERE id = $1`,
    [id]
  );
  return row ? rowToProduct(row) : null;
}

export async function getProductWithDetails(slug: string): Promise<{
  product: Product;
  variants: ProductVariant[];
  category: Category;
  brand: Brand | null;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  relatedProducts: Product[];
} | null> {
  const product = await getProductBySlug(slug);
  if (!product) return null;

  const [variants, category, brand, reviews, stats, related] = await Promise.all([
    getProductVariants(product.id),
    getCategoryById(product.categoryId),
    product.brandId ? getBrandById(product.brandId) : null,
    getProductReviews(product.id),
    getProductStats(product.id),
    getRelatedProducts(product.id, product.categoryId, 4),
  ]);

  return {
    product,
    variants,
    category: category!,
    brand,
    reviews,
    avgRating: stats?.avgRating || 0,
    reviewCount: stats?.reviewCount || 0,
    relatedProducts: related,
  };
}

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const rows = await queryMany<VariantRow>(
    `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position`,
    [productId]
  );
  return rows.map(rowToVariant);
}

export async function getProductStats(productId: string): Promise<{
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  soldLast30Days: number;
} | null> {
  const row = await queryOne<ProductStatsRow>(
    `SELECT * FROM product_stats WHERE product_id = $1`,
    [productId]
  );
  if (!row) return null;

  return {
    avgRating: parseFloat(row.avg_rating),
    reviewCount: parseInt(row.review_count, 10),
    viewCount: parseInt(row.view_count, 10),
    soldLast30Days: parseInt(row.sold_last_30_days, 10),
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT p.* FROM products p
     WHERE p.category_id = $1
       AND p.id != $2
       AND p.status = 'active'
     ORDER BY RANDOM()
     LIMIT $3`,
    [categoryId, productId, limit]
  );
  return rows.map(rowToProduct);
}

export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT * FROM products
     WHERE status = 'active'
       AND (name ILIKE $1 OR description ILIKE $1 OR tags @> ARRAY[$2])
     ORDER BY
       CASE WHEN name ILIKE $3 THEN 0 ELSE 1 END,
       created_at DESC
     LIMIT $4`,
    [`%${query}%`, query, `${query}%`, limit]
  );
  return rows.map(rowToProduct);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const rows = await queryMany<CategoryRow>(
    `SELECT * FROM categories ORDER BY position`
  );
  return rows.map(rowToCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const row = await queryOne<CategoryRow>(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  );
  return row ? rowToCategory(row) : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const row = await queryOne<CategoryRow>(
    `SELECT * FROM categories WHERE slug = $1`,
    [slug]
  );
  return row ? rowToCategory(row) : null;
}

export async function getCategoryHierarchy(): Promise<(Category & { children: Category[] })[]> {
  const categories = await getCategories();
  const topLevel = categories.filter(c => c.parentId === null);

  return topLevel.map(parent => ({
    ...parent,
    children: categories.filter(c => c.parentId === parent.id),
  }));
}

// Brands
export async function getBrands(): Promise<Brand[]> {
  const rows = await queryMany<BrandRow>(
    `SELECT * FROM brands ORDER BY name`
  );
  return rows.map(rowToBrand);
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const row = await queryOne<BrandRow>(
    `SELECT * FROM brands WHERE id = $1`,
    [id]
  );
  return row ? rowToBrand(row) : null;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const row = await queryOne<BrandRow>(
    `SELECT * FROM brands WHERE slug = $1`,
    [slug]
  );
  return row ? rowToBrand(row) : null;
}

// Reviews
export async function getProductReviews(
  productId: string,
  limit: number = 10
): Promise<Review[]> {
  const rows = await queryMany<ReviewRow>(
    `SELECT * FROM reviews
     WHERE product_id = $1 AND status = 'approved'
     ORDER BY helpful_count DESC, created_at DESC
     LIMIT $2`,
    [productId, limit]
  );
  return rows.map(rowToReview);
}

export async function getReviewById(id: string): Promise<Review | null> {
  const row = await queryOne<ReviewRow>(
    `SELECT * FROM reviews WHERE id = $1`,
    [id]
  );
  return row ? rowToReview(row) : null;
}

// Featured / Homepage products
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT * FROM products
     WHERE status = 'active' AND 'featured' = ANY(tags)
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowToProduct);
}

export async function getNewArrivals(limit: number = 8): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT * FROM products
     WHERE status = 'active'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowToProduct);
}

export async function getBestSellers(limit: number = 8): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT p.* FROM products p
     LEFT JOIN product_stats ps ON ps.product_id = p.id
     WHERE p.status = 'active'
     ORDER BY COALESCE(ps.sold_last_30_days, 0) DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowToProduct);
}

export async function getProductsOnSale(limit: number = 8): Promise<Product[]> {
  const rows = await queryMany<ProductRow>(
    `SELECT * FROM products
     WHERE status = 'active' AND compare_at_price IS NOT NULL
     ORDER BY (compare_at_price - base_price) / compare_at_price DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowToProduct);
}
