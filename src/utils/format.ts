/**
 * Currency and Number Formatting Utility with Rupiah (IDR) and USD support
 */

export function formatCurrency(amount: number, symbol: string = '$', currencyCode: string = 'USD'): string {
  if (isNaN(amount)) return `${symbol}0`;

  const isRupiah = symbol === 'Rp' || currencyCode === 'IDR';

  if (isRupiah) {
    // Indonesian Rupiah: integers with dot thousand separators
    const rounded = Math.round(amount);
    return `Rp ${rounded.toLocaleString('id-ID')}`;
  }

  // USD / Standard decimals: 2 decimal places with comma thousand separators
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getQuickCashTenderOptions(total: number, symbol: string = '$'): number[] {
  const isRupiah = symbol === 'Rp';

  if (isRupiah) {
    // Rupiah bill denominations: 2.000, 5.000, 10.000, 20.000, 50.000, 100.000
    const list: number[] = [Math.round(total)]; // Exact

    // Round up to next 10.000
    const ceil10k = Math.ceil(total / 10000) * 10000;
    if (ceil10k > total && !list.includes(ceil10k)) list.push(ceil10k);

    // Round up to next 20.000
    const ceil20k = Math.ceil(total / 20000) * 20000;
    if (ceil20k > total && !list.includes(ceil20k)) list.push(ceil20k);

    // Round up to next 50.000
    const ceil50k = Math.ceil(total / 50000) * 50000;
    if (ceil50k > total && !list.includes(ceil50k)) list.push(ceil50k);

    // Round up to next 100.000
    const ceil100k = Math.ceil(total / 100000) * 100000;
    if (ceil100k > total && !list.includes(ceil100k)) list.push(ceil100k);

    if (total < 50000 && !list.includes(50000)) list.push(50000);
    if (total < 100000 && !list.includes(100000)) list.push(100000);

    return list.slice(0, 5);
  }

  // Standard USD options: Exact, next 5, next 10, 20, 50, 100
  const list: number[] = [total];
  const ceil5 = Math.ceil(total / 5) * 5;
  if (ceil5 > total && !list.includes(ceil5)) list.push(ceil5);

  const ceil10 = Math.ceil(total / 10) * 10;
  if (ceil10 > total && !list.includes(ceil10)) list.push(ceil10);

  const ceil20 = Math.ceil(total / 20) * 20;
  if (ceil20 > total && !list.includes(ceil20)) list.push(ceil20);

  if (total < 50 && !list.includes(50)) list.push(50);
  if (total < 100 && !list.includes(100)) list.push(100);

  return list.slice(0, 5);
}
