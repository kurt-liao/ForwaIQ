// 货币转换工具
// 基准货币: TWD

export const EXCHANGE_RATES = {
  TWD: 1.0,    // 基准货币
  USD: 31.0,   // 1 USD ≈ 31 TWD
  CNY: 4.3,    // 1 CNY ≈ 4.3 TWD
  EUR: 33.5,   // 1 EUR ≈ 33.5 TWD
} as const;

export type Currency = keyof typeof EXCHANGE_RATES;

/**
 * 将指定货币的金额转换为 TWD
 */
export function convertToTWD(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency as Currency];
  if (!rate) {
    console.warn(`未知货币: ${currency}, 使用默认汇率 1.0`);
    return amount;
  }
  return amount * rate;
}

/**
 * 将 TWD 金额转换为指定货币
 */
export function convertFromTWD(amountTWD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency as Currency];
  if (!rate) {
    console.warn(`未知货币: ${targetCurrency}, 使用默认汇率 1.0`);
    return amountTWD;
  }
  return amountTWD / rate;
}

/**
 * 计算多个货币项目的总 TWD 金额
 */
export function calculateTotalTWD(lineItems: Array<{ cost: number; currency: string }>): number {
  return lineItems.reduce((total, item) => {
    return total + convertToTWD(item.cost, item.currency);
  }, 0);
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    TWD: 'NT$',
    CNY: '¥',
    EUR: '€',
  };
  return symbols[currency] || currency;
}