// Mock Payment Service
// Simulates Stripe-like API for benchmark fairness
// Same interface across all framework implementations

import type { Currency, PaymentIntent, PaymentMethod, Refund } from '../types';

interface CreatePaymentIntentParams {
  amount: number;
  currency: Currency;
  metadata?: Record<string, unknown>;
}

interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId: string;
}

interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

interface PaymentError {
  code: string;
  message: string;
  declineCode?: string;
}

// In-memory store for payment intents (simulates database)
const paymentIntents = new Map<string, PaymentIntent>();
const paymentMethods = new Map<string, PaymentMethod>();
const refunds = new Map<string, Refund>();

function generateId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSecret(): string {
  return generateId('pi_secret');
}

// Simulate network latency (configurable for benchmarks)
let simulatedLatency = 0;

export function setSimulatedLatency(ms: number): void {
  simulatedLatency = ms;
}

async function simulateNetwork<T>(result: T): Promise<T> {
  if (simulatedLatency > 0) {
    await new Promise(resolve => setTimeout(resolve, simulatedLatency));
  }
  return result;
}

// Test card numbers (Stripe-like)
const TEST_CARDS = {
  '4242424242424242': { result: 'success' },
  '4000000000000002': { result: 'decline', code: 'card_declined', message: 'Your card was declined.' },
  '4000000000009995': { result: 'decline', code: 'insufficient_funds', message: 'Your card has insufficient funds.' },
  '4000000000000069': { result: 'decline', code: 'expired_card', message: 'Your card has expired.' },
  '4000000000000127': { result: 'decline', code: 'incorrect_cvc', message: 'Your card\'s security code is incorrect.' },
  '4000000000000119': { result: 'error', code: 'processing_error', message: 'An error occurred while processing your card.' },
} as const;

export class MockPaymentService {
  /**
   * Create a payment intent (similar to Stripe's createPaymentIntent)
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const id = generateId('pi');
    const clientSecret = generateSecret();

    const intent: PaymentIntent = {
      id,
      orderId: null,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      paymentMethod: null,
      clientSecret,
      metadata: params.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    paymentIntents.set(id, intent);
    return simulateNetwork(intent);
  }

  /**
   * Retrieve a payment intent by ID
   */
  async getPaymentIntent(id: string): Promise<PaymentIntent | null> {
    return simulateNetwork(paymentIntents.get(id) || null);
  }

  /**
   * Update a payment intent
   */
  async updatePaymentIntent(
    id: string,
    updates: Partial<Pick<PaymentIntent, 'amount' | 'currency' | 'metadata'>>
  ): Promise<PaymentIntent | null> {
    const intent = paymentIntents.get(id);
    if (!intent || intent.status !== 'pending') {
      return simulateNetwork(null);
    }

    const updated: PaymentIntent = {
      ...intent,
      ...updates,
      updatedAt: new Date(),
    };
    paymentIntents.set(id, updated);
    return simulateNetwork(updated);
  }

  /**
   * Create a payment method (similar to Stripe's createPaymentMethod)
   */
  async createPaymentMethod(params: {
    type: 'card';
    card: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    };
    userId?: string;
  }): Promise<PaymentMethod> {
    const id = generateId('pm');
    const last4 = params.card.number.slice(-4);

    // Determine card brand from number
    let brand: NonNullable<PaymentMethod['card']>['brand'] = 'visa';
    if (params.card.number.startsWith('5')) brand = 'mastercard';
    if (params.card.number.startsWith('34') || params.card.number.startsWith('37')) brand = 'amex';
    if (params.card.number.startsWith('6')) brand = 'discover';

    const method: PaymentMethod = {
      id,
      userId: params.userId || null,
      type: 'card',
      card: {
        brand,
        last4,
        expMonth: params.card.expMonth,
        expYear: params.card.expYear,
      },
      isDefault: false,
      createdAt: new Date(),
    };

    paymentMethods.set(id, method);
    return simulateNetwork(method);
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(paymentMethodId: string, userId: string): Promise<PaymentMethod | null> {
    const method = paymentMethods.get(paymentMethodId);
    if (!method) {
      return simulateNetwork(null);
    }

    const updated: PaymentMethod = {
      ...method,
      userId,
    };
    paymentMethods.set(paymentMethodId, updated);
    return simulateNetwork(updated);
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const methods = Array.from(paymentMethods.values()).filter(m => m.userId === userId);
    return simulateNetwork(methods);
  }

  /**
   * Confirm a payment intent (similar to Stripe's confirmPaymentIntent)
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<{
    success: boolean;
    paymentIntent?: PaymentIntent;
    error?: PaymentError;
  }> {
    const intent = paymentIntents.get(params.paymentIntentId);
    const method = paymentMethods.get(params.paymentMethodId);

    if (!intent) {
      return simulateNetwork({
        success: false,
        error: { code: 'payment_intent_not_found', message: 'Payment intent not found.' },
      });
    }

    if (!method) {
      return simulateNetwork({
        success: false,
        error: { code: 'payment_method_not_found', message: 'Payment method not found.' },
      });
    }

    if (intent.status !== 'pending') {
      return simulateNetwork({
        success: false,
        error: { code: 'invalid_state', message: `Payment intent is ${intent.status}, not pending.` },
      });
    }

    // Check test card behavior
    const cardNumber = Object.keys(TEST_CARDS).find(num =>
      method.card?.last4 === num.slice(-4)
    );

    if (cardNumber) {
      const behavior = TEST_CARDS[cardNumber as keyof typeof TEST_CARDS];
      if (behavior.result !== 'success') {
        const updated: PaymentIntent = {
          ...intent,
          status: 'failed',
          paymentMethod: method,
          updatedAt: new Date(),
        };
        paymentIntents.set(intent.id, updated);

        return simulateNetwork({
          success: false,
          paymentIntent: updated,
          error: {
            code: behavior.code,
            message: behavior.message,
            declineCode: behavior.result === 'decline' ? behavior.code : undefined,
          },
        });
      }
    }

    // Success case
    const updated: PaymentIntent = {
      ...intent,
      status: 'succeeded',
      paymentMethod: method,
      updatedAt: new Date(),
    };
    paymentIntents.set(intent.id, updated);

    return simulateNetwork({
      success: true,
      paymentIntent: updated,
    });
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(id: string): Promise<PaymentIntent | null> {
    const intent = paymentIntents.get(id);
    if (!intent || !['pending', 'processing'].includes(intent.status)) {
      return simulateNetwork(null);
    }

    const updated: PaymentIntent = {
      ...intent,
      status: 'cancelled',
      updatedAt: new Date(),
    };
    paymentIntents.set(id, updated);
    return simulateNetwork(updated);
  }

  /**
   * Create a refund
   */
  async createRefund(params: CreateRefundParams): Promise<{
    success: boolean;
    refund?: Refund;
    error?: PaymentError;
  }> {
    const intent = paymentIntents.get(params.paymentIntentId);

    if (!intent) {
      return simulateNetwork({
        success: false,
        error: { code: 'payment_intent_not_found', message: 'Payment intent not found.' },
      });
    }

    if (intent.status !== 'succeeded') {
      return simulateNetwork({
        success: false,
        error: { code: 'invalid_state', message: 'Can only refund succeeded payments.' },
      });
    }

    const amount = params.amount || intent.amount;
    if (amount > intent.amount) {
      return simulateNetwork({
        success: false,
        error: { code: 'amount_too_large', message: 'Refund amount exceeds payment amount.' },
      });
    }

    const id = generateId('re');
    const refund: Refund = {
      id,
      paymentIntentId: params.paymentIntentId,
      amount,
      reason: params.reason || null,
      status: 'succeeded',
      createdAt: new Date(),
    };

    refunds.set(id, refund);

    return simulateNetwork({
      success: true,
      refund,
    });
  }

  /**
   * List refunds for a payment intent
   */
  async listRefunds(paymentIntentId: string): Promise<Refund[]> {
    const result = Array.from(refunds.values()).filter(r => r.paymentIntentId === paymentIntentId);
    return simulateNetwork(result);
  }

  /**
   * Clear all data (useful for testing)
   */
  reset(): void {
    paymentIntents.clear();
    paymentMethods.clear();
    refunds.clear();
  }
}

// Singleton instance
export const paymentService = new MockPaymentService();

// Checkout session helpers
export interface CheckoutSession {
  id: string;
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: Currency;
  status: 'open' | 'complete' | 'expired';
  successUrl: string;
  cancelUrl: string;
  createdAt: Date;
  expiresAt: Date;
}

const checkoutSessions = new Map<string, CheckoutSession>();

export async function createCheckoutSession(params: {
  amount: number;
  currency: Currency;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<CheckoutSession> {
  const intent = await paymentService.createPaymentIntent({
    amount: params.amount,
    currency: params.currency,
    metadata: params.metadata,
  });

  const session: CheckoutSession = {
    id: generateId('cs'),
    paymentIntentId: intent.id,
    clientSecret: intent.clientSecret,
    amount: params.amount,
    currency: params.currency,
    status: 'open',
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  checkoutSessions.set(session.id, session);
  return simulateNetwork(session);
}

export async function getCheckoutSession(id: string): Promise<CheckoutSession | null> {
  const session = checkoutSessions.get(id);
  if (!session) return simulateNetwork(null);

  // Check expiry
  if (session.status === 'open' && new Date() > session.expiresAt) {
    session.status = 'expired';
    checkoutSessions.set(id, session);
  }

  return simulateNetwork(session);
}

export async function completeCheckoutSession(
  id: string,
  paymentMethodId: string
): Promise<{
  success: boolean;
  session?: CheckoutSession;
  error?: PaymentError;
}> {
  const session = checkoutSessions.get(id);
  if (!session) {
    return simulateNetwork({
      success: false,
      error: { code: 'session_not_found', message: 'Checkout session not found.' },
    });
  }

  if (session.status !== 'open') {
    return simulateNetwork({
      success: false,
      error: { code: 'invalid_state', message: `Session is ${session.status}.` },
    });
  }

  const result = await paymentService.confirmPayment({
    paymentIntentId: session.paymentIntentId,
    paymentMethodId,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  session.status = 'complete';
  checkoutSessions.set(id, session);

  return simulateNetwork({
    success: true,
    session,
  });
}
