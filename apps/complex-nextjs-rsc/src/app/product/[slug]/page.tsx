// Server Component - Product detail page
import { notFound } from 'next/navigation';
import {
  getProductBySlug,
  getProductVariants,
  getProductReviews,
  getRelatedProducts,
  getProductRating,
} from '@/lib/data';
import { getCategoryBySlug, getBrandBySlug, getCategories, getBrands } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [variants, reviews, related, categories, brands] = await Promise.all([
    getProductVariants(product.id),
    getProductReviews(product.id, 10),
    getRelatedProducts(product.id, product.categoryId, 4),
    getCategories(),
    getBrands(),
  ]);

  const category = categories.find(c => c.id === product.categoryId)!;
  const brand = brands.find(b => b.id === product.brandId) || null;
  const rating = getProductRating(product.id);

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: category.name, href: `/category/${category.slug}` },
          { label: product.name },
        ]}
      />

      <ProductDetail
        product={product}
        variants={variants}
        category={category}
        brand={brand}
        avgRating={rating.average}
        reviewCount={rating.count}
      />

      <ProductReviews
        reviews={reviews}
        productId={product.id}
        avgRating={rating.average}
        reviewCount={rating.count}
      />

      <RelatedProducts products={related} />
    </div>
  );
}
