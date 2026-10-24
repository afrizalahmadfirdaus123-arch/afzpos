/**
 * Cetak laporan di aplikasi Android.
 * - Web: memakai dialog cetak browser (window.print).
 * - Android: cetak ke printer thermal Bluetooth jika terhubung,
 *   jika belum terhubung laporan dibagikan sebagai teks.
 */

import { SalesReport, DrawerSession, StoreConfig } from '../types/pos';
import { formatCurrency } from './format';
import { bluetoothPrinter, PrintLine } from './bluetoothPrinter';
import { isNativeApp, shareText } from './nativeBridge';

const TEXT_COLUMNS = 32;

export function linesToText(lines: PrintLine[], cols = TEXT_COLUMNS): string {
  return lines
    .map(line => {
      if (Array.isArray(line)) {
        const [left, right] = line;
        return left + ' '.repeat(Math.max(1, cols - left.length - right.length)) + right;
      }
      if (line === '---') return '-'.repeat(cols);
      return line;
    })
    .join('\n');
}

export interface PrintableReport {
  title: string;
  lines: PrintLine[];
}

export type PrintOutcome = 'browser' | 'printed' | 'shared';

export async function printOrShareReport(
  report: PrintableReport,
  config: StoreConfig
): Promise<PrintOutcome> {
  if (!isNativeApp()) {
    window.print();
    return 'browser';
  }

  if (bluetoothPrinter.getState().isConnected) {
    try {
      await bluetoothPrinter.printLines(report.title, report.lines, config.storeName);
      return 'printed';
    } catch (err) {
      console.warn('Cetak Bluetooth gagal, laporan dibagikan sebagai teks:', err);
    }
  }

  const text = [
    config.storeName,
    report.title,
    '-'.repeat(TEXT_COLUMNS),
    linesToText(report.lines)
  ].join('\n');
  await shareText(report.title, text);
  return 'shared';
}

export function buildSalesReportLines(
  report: SalesReport,
  config: StoreConfig,
  periodLabel: string
): PrintableReport {
  const id = config.language === 'id';
  const f = (n: number) => formatCurrency(n, config.currencySymbol, config.currencyCode);

  const lines: PrintLine[] = [
    new Date().toLocaleString(id ? 'id-ID' : 'en-US'),
    '---',
    [id ? 'Penjualan Kotor' : 'Gross Sales', f(report.totalGrossSales)],
    [id ? 'Penjualan Bersih' : 'Net Sales', f(report.totalNetSales)],
    [id ? 'Pajak' : 'Tax', f(report.totalTax)],
    [id ? 'Tip' : 'Tips', f(report.totalTips)],
    [id ? 'Diskon' : 'Discounts', f(report.totalDiscounts)],
    [id ? 'Jumlah Transaksi' : 'Transactions', String(report.transactionCount)],
    [id ? 'Rata-rata' : 'Average', f(report.averageTransactionValue)],
    '---',
    id ? 'PEMBAYARAN' : 'PAYMENTS',
    [id ? '  Tunai' : '  Cash', f(report.paymentMethodTotals.cash)],
    [id ? '  Kartu' : '  Card', f(report.paymentMethodTotals.card)],
    ['  QRIS', f(report.paymentMethodTotals.qr)]
  ];

  if (report.productStats.length > 0) {
    lines.push('---');
    lines.push(id ? 'PENJUALAN PER PRODUK' : 'SALES BY PRODUCT');
    report.productStats.slice(0, 20).forEach(p => {
      lines.push(p.name);
      lines.push([`  ${p.quantitySold} x`, f(p.grossRevenue)]);
    });
  }

  return {
    title: `${id ? 'LAPORAN PENJUALAN' : 'SALES REPORT'} - ${periodLabel}`,
    lines
  };
}

export function buildShiftReportLines(
  session: DrawerSession,
  config: StoreConfig
): PrintableReport {
  const f = (n: number) => formatCurrency(n, config.currencySymbol, config.currencyCode);
  const variance = session.variance || 0;
  const varianceText = variance >= 0 ? `+${f(variance)}` : `-${f(Math.abs(variance))}`;
  const gross = session.cashSales + session.cardSales + session.qrSales;

  return {
    title: 'LAPORAN TUTUP SHIFT (Z-REPORT)',
    lines: [
      new Date().toLocaleString('id-ID'),
      `Kasir: ${session.cashierName}`,
      '---',
      ['Modal Awal', f(session.startingFloat)],
      ['Penjualan Tunai', f(session.cashSales)],
      ['Penjualan Kartu', f(session.cardSales)],
      ['Penjualan QRIS', f(session.qrSales)],
      ['TOTAL KOTOR', f(gross)],
      '---',
      ['Kas Dihitung', f(session.countedCashAtClose || 0)],
      ['SELISIH', varianceText]
    ]
  };
}
