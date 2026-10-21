export const commissionPercent = (rate: number) =>
  `${(rate * 100).toLocaleString('en-PK', { maximumFractionDigits: 2 })}%`;
