// Currency formatting utilities - separate from data to avoid bundling seed data
const currencyFormatters: Record<string, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
};

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return currencyFormatters[currency]?.format(amount) ?? `$${amount.toFixed(2)}`;
}
