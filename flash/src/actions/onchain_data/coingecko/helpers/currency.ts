/**
 * Get the currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    jpy: '¥',
    btc: '₿',
    eth: 'Ξ',
  };
  
  return symbols[currency.toLowerCase()] || currency;
}

/**
 * Get a human-readable timeframe label from days
 */
export function getTimeframeLabel(days: string): string {
  const labels: Record<string, string> = {
    '1': '24-Hour',
    '7': '7-Day',
    '14': '14-Day',
    '30': '30-Day',
    '90': '3-Month',
    '180': '6-Month',
    '365': '1-Year',
    'max': 'All-Time'
  };
  
  return labels[days] || `${days}-Day`;
} 