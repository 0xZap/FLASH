/**
 * Format a date to a consistent readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Import getCurrencySymbol from currency.ts
import { getCurrencySymbol } from './currency';

/**
 * Format a number with appropriate currency symbol
 */
export function formatNumber(num: number, currency: string = 'usd'): string {
  if (num === null || num === undefined) return 'N/A';
  
  const symbol = getCurrencySymbol(currency);
  
  if (num >= 1_000_000_000) {
    return `${symbol}${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${symbol}${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${symbol}${(num / 1_000).toFixed(2)}K`;
  } else if (num < 0.01 && num > 0) {
    return `${symbol}${num.toFixed(8)}`;
  } else {
    return `${symbol}${num.toFixed(2)}`;
  }
}

/**
 * Format a large number with appropriate currency symbol
 */
export function formatLargeNumber(num: number, currency: string = 'usd'): string {
  if (num === null || num === undefined) return 'N/A';
  
  const symbol = getCurrencySymbol(currency);
  
  if (num >= 1_000_000_000) {
    return `${symbol}${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${symbol}${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${symbol}${(num / 1_000).toFixed(2)}K`;
  } else {
    return `${symbol}${num.toFixed(2)}`;
  }
}

/**
 * Format a number without currency symbol
 */
export function formatNumberWithoutSymbol(num: number): string {
  if (num === null || num === undefined) return "N/A";
  
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  } else {
    return `${num.toFixed(2)}`;
  }
}

/**
 * Format a currency value with appropriate precision
 */
export function formatCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  
  if (value >= 1000) {
    return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  } else if (value >= 1) {
    return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  } else {
    return `${symbol}${value.toLocaleString(undefined, { maximumSignificantDigits: 4 })}`;
  }
}

/**
 * Format supply values with appropriate symbol
 */
export function formatSupply(supply: number | null, symbol: string): string {
  if (!supply) return 'N/A';
  
  if (supply >= 1_000_000_000) {
    return `${(supply / 1_000_000_000).toFixed(2)}B ${symbol.toUpperCase()}`;
  } else if (supply >= 1_000_000) {
    return `${(supply / 1_000_000).toFixed(2)}M ${symbol.toUpperCase()}`;
  } else if (supply >= 1_000) {
    return `${(supply / 1_000).toFixed(2)}K ${symbol.toUpperCase()}`;
  } else {
    return `${supply.toFixed(2)} ${symbol.toUpperCase()}`;
  }
}

/**
 * Helper to capitalize first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 