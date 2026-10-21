export const bookingLabel = (value?: string) =>
  value
    ? value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    : 'Not recorded';
export const bookingMoney = (value?: number | null, currency = 'PKR') =>
  value == null
    ? 'Not recorded'
    : `${currency || 'PKR'} ${value.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
