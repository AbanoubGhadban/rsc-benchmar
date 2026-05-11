import { NextResponse } from 'next/server';
import { getCart } from '@/lib/data';
import { paymentService } from '@shared/services/payment';

export async function POST(request: Request) {
  const formData = await request.json();

  const cart = await getCart();
  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Create payment intent
  const paymentIntent = await paymentService.createPaymentIntent({
    amount: cart.total,
    currency: 'USD',
    metadata: {
      email: formData.email,
      cartId: cart.id,
    },
  });

  // Confirm payment with test card
  const paymentResult = await paymentService.confirmPayment({
    paymentIntentId: paymentIntent.id,
    paymentMethodId: formData.cardNumber.replace(/\s/g, ''),
  });

  if (!paymentResult.success || !paymentResult.paymentIntent) {
    return NextResponse.json(
      { error: 'Payment failed', code: paymentResult.error?.code },
      { status: 400 }
    );
  }

  // In real app: create order in database, clear cart, send confirmation email
  // For benchmark: simulate successful order creation
  const orderId = `order-${Date.now()}`;

  return NextResponse.json({
    success: true,
    orderId,
    paymentId: paymentResult.paymentIntent.id,
  });
}
