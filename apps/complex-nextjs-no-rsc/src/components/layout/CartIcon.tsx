// Server Component - receives count as prop
import Link from 'next/link';

interface CartIconProps {
  count: number;
}

export function CartIcon({ count }: CartIconProps) {
  return (
    <Link href="/cart" className="icon-btn" aria-label="Cart">
      🛒
      {count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
