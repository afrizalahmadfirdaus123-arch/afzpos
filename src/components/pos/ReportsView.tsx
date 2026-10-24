import React, { useState, useMemo, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { SalesReportPeriod } from '../../types/pos';
import { formatCurrency } from '../../utils/format';
import { sendReportToWhatsApp, isInternetConnected } from '../../utils/whatsapp';
import { saveTextFile, openExternalUrl, isNativeApp } from '../../utils/nativeBridge';
import { printOrShareReport, buildSalesReportLines } from '../../utils/reportPrint';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  CreditCard,
  QrCode,
  Download,
  Printer,
  Calendar,
  Layers,
  BarChart3,
  Percent,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Wifi,
  ExternalLink
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { generateSalesReport, config, t, products } = usePOS();
  const [selectedPeriod, setSelectedPeriod] = useState<SalesReportPeriod>('daily');
  const [whatsappStatus, setWhatsappStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(isInternetConnected());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const report = useMemo(() => {
    return generateSalesReport(selectedPeriod);
  }, [generateSalesReport, selectedPeriod]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = `Sales Report - ${selectedPeriod.toUpperCase()}\n`;
    csv += `Generated At: ${new Date().toLocaleString()}\n\n`;
    csv += `Summary Metrics\n`;
    csv += `Total Gross Sales,${report.totalGrossSales}\n`;
    csv += `Total Net Sales,${report.totalNetSales}\n`;
    csv += `Total Tax Collected,${report.totalTax}\n`;
    csv += `Total Tips,${report.totalTips}\n`;
    csv += `Total Discounts,${report.totalDiscounts}\n`;
    csv += `Completed Transactions,${report.transactionCount}\n`;
    csv += `Average Transaction Value,${report.averageTransactionValue}\n\n`;

    csv += `Sales by Product\n`;
    csv += `Product Name,SKU,Units Sold,Gross Revenue,% of Sales\n`;
    report.productStats.forEach(p => {
      csv += `"${p.name}","${p.sku}",${p.quantitySold},${p.grossRevenue},${p.sharePercentage}%\n`;
    });

    void saveTextFile(
      `sales-report-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
  };

  const handlePrint = () => {
    const isId = config.language === 'id';
    const labels: Record<string, string> = {
      daily: isId ? 'Harian' : 'Daily',
      weekly: isId ? 'Mingguan' : 'Weekly',
      monthly: isId ? 'Bulanan' : 'Monthly',
      all: isId ? 'Semua Waktu' : 'All Time'
    };
    void printOrShareReport(
      buildSalesReportLines(report, config, labels[selectedPeriod] ?? selectedPeriod),
      config
    );
  };

  const handleSendWhatsApp = () => {
    const lowStockProducts = products.filter(
      p => p.stock <= (p.minStockThreshold || 15)
    );
    const periodName =
      selectedPeriod === 'daily'
        ? (config.language === 'id' ? 'Harian' : 'Daily')
        : selectedPeriod === 'weekly'
        ? (config.language === 'id' ? 'Mingguan' : 'Weekly')
        : selectedPeriod === 'monthly'
        ? (config.language === 'id' ? 'Bulanan' : 'Monthly')
        : (config.language === 'id' ? 'Semua Waktu' : 'All Time');

    const result = sendReportToWhatsApp({
      report,
      config,
      lowStockProducts,
      periodLabel: periodName
    });

    setWhatsappStatus({
      type: result.success ? 'success' : 'error',
      message: result.message,
      url: result.url
    });

    // Auto-clear message after 6 seconds
    setTimeout(() => {
      setWhatsappStatus(null);
    }, 6000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Period Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              {t('salesReportsTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('salesReportsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Segmented Buttons */}
            <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              {(['daily', 'weekly', 'monthly', 'all'] as SalesReportPeriod[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedPeriod === p
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'daily' && t('daily')}
                  {p === 'weekly' && t('weekly')}
                  {p === 'monthly' && t('monthly')}
                  {p === 'all' && t('allTime')}
                </button>
              ))}
            </div>

            {/* WhatsApp Send Button */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              title={`Kirim Ringkasan ke WhatsApp (${config.whatsappNumber || 'Belum diatur'})`}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>{config.language === 'id' ? 'Kirim WhatsApp' : 'Send WhatsApp'}</span>
            </button>

            {/* Export and Print Buttons */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('exportCsv')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('printReport')}</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Dispatch Banner Feedback */}
        {whatsappStatus && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              whatsappStatus.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-600/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {whatsappStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{whatsappStatus.message}</span>
            </div>
            {whatsappStatus.url && (
              <a
                href={whatsappStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => {
                  if (isNativeApp()) {
                    e.preventDefault();
                    void openExternalUrl(whatsappStatus.url!);
                  }
                }}
                className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 ml-3"
              >
                <span>Buka Manual</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gross Sales */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('totalGrossSales')}</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatCurrency(report.totalGrossSales, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              {t('netRevenue')}: {formatCurrency(report.totalNetSales, config.currencySymbol, config.currencyCode)}
            </p>
          </div>

          {/* Transaction Count */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('totalTransactions')}</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {report.transactionCount}
            </div>
            <p className="text-[11px] text-slate-500">
              Orders successfully closed
            </p>
          </div>

          {/* Average Basket Value */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('averageBasket')}</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {formatCurrency(report.averageTransactionValue, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Average spend per customer
            </p>
          </div>

          {/* Tax & Discounts */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('tax')} & {t('discount')}</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400 tabular-nums">
              {formatCurrency(report.totalTax, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Discounts: {formatCurrency(report.totalDiscounts, config.currencySymbol, config.currencyCode)}
            </p>
          </div>
        </div>

        {/* Payment Methods Breakdown Strip */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            {t('paymentBreakdown')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('cash')}</span>
                <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                  {formatCurrency(report.paymentMethodTotals.cash, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-500">
                {report.totalGrossSales > 0
                  ? `${((report.paymentMethodTotals.cash / report.totalGrossSales) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>

            {/* Card */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('card')}</span>
                <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                  {formatCurrency(report.paymentMethodTotals.card, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-500">
                {report.totalGrossSales > 0
                  ? `${((report.paymentMethodTotals.card / report.totalGrossSales) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>

            {/* QR / Mobile */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('qrMobile')}</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  {formatCurrency(report.paymentMethodTotals.qr, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-500">
                {report.totalGrossSales > 0
                  ? `${((report.paymentMethodTotals.qr / report.totalGrossSales) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Sales by Product Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{t('productSalesBreakdown')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Itemized breakdown showing units sold and revenue contribution
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {report.productStats.length} items sold
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">{t('productName')}</th>
                  <th className="px-5 py-3.5">{t('sku')}</th>
                  <th className="px-5 py-3.5 text-center">{t('unitsSold')}</th>
                  <th className="px-5 py-3.5 text-right">{t('totalRevenue')}</th>
                  <th className="px-5 py-3.5 text-right">{t('shareOfSales')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {report.productStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-xs">
                      {t('noSalesInPeriod')}
                    </td>
                  </tr>
                ) : (
                  report.productStats.map(stat => (
                    <tr key={stat.productId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">
                        {stat.name}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {stat.sku}
                      </td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-slate-200">
                        {stat.quantitySold}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                        {formatCurrency(stat.grossRevenue, config.currencySymbol, config.currencyCode)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300 tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full"
                              style={{ width: `${Math.min(100, stat.sharePercentage)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right">{stat.sharePercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
