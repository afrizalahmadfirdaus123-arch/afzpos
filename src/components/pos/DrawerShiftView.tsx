import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { DrawerSession } from '../../types/pos';
import { formatCurrency } from '../../utils/format';
import { sendReportToWhatsApp, isInternetConnected } from '../../utils/whatsapp';
import { openExternalUrl, isNativeApp } from '../../utils/nativeBridge';
import { printOrShareReport, buildShiftReportLines } from '../../utils/reportPrint';
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  History,
  TrendingUp,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  ExternalLink
} from 'lucide-react';

export const DrawerShiftView: React.FC = () => {
  const { currentShift, shiftHistory, recordCashMovement, closeShift, config, language, products, generateSalesReport } = usePOS();

  // Cash movement modal
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // End Shift / Z-Report modal
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [countedCash, setCountedCash] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [lastClosedReport, setLastClosedReport] = useState<DrawerSession | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
  } | null>(null);

  // Send shift report to WhatsApp
  const handleSendWhatsAppShiftReport = () => {
    const report = generateSalesReport('daily');
    const lowStockProducts = products.filter(
      p => p.stock <= (p.minStockThreshold || 15)
    );
    const result = sendReportToWhatsApp({
      report,
      config,
      lowStockProducts,
      periodLabel: language === 'id' ? 'TUTUP SHIFT' : 'SHIFT CLOSE'
    });
    setWhatsappStatus({
      type: result.success ? 'success' : 'error',
      message: result.message,
      url: result.url
    });
  };

  // Compute shift cash flow totals
  const totalCashIn = useMemo(() => {
    return currentShift.movements
      .filter(m => m.type === 'cash_in')
      .reduce((acc, m) => acc + m.amount, 0);
  }, [currentShift.movements]);

  const totalCashOut = useMemo(() => {
    return currentShift.movements
      .filter(m => m.type === 'cash_out')
      .reduce((acc, m) => acc + m.amount, 0);
  }, [currentShift.movements]);

  const expectedCashInDrawer = useMemo(() => {
    return currentShift.startingFloat + currentShift.cashSales + totalCashIn - totalCashOut;
  }, [currentShift.startingFloat, currentShift.cashSales, totalCashIn, totalCashOut]);

  const grossSales = useMemo(() => {
    return currentShift.cashSales + currentShift.cardSales + currentShift.qrSales;
  }, [currentShift]);

  // Handle Cash In / Out Submit
  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0) return;
    recordCashMovement(
      movementType,
      amount,
      movementReason.trim() || (movementType === 'cash_in' ? 'Tambah uang kembalian' : 'Pengeluaran operasional')
    );
    setMovementAmount('');
    setMovementReason('');
    setShowMovementModal(false);
  };

  // Handle Close Shift
  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCash);
    if (isNaN(counted) || counted < 0) return;
    const closed = closeShift(counted, closingNote.trim());
    setLastClosedReport(closed);
    setShowCloseShiftModal(false);
    setCountedCash('');
    setClosingNote('');

    // If auto-send daily report is enabled, send report to WhatsApp automatically
    if (config.autoSendWhatsAppDaily) {
      setTimeout(() => {
        handleSendWhatsAppShiftReport();
      }, 300);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-xl font-bold text-white">
                {language === 'id' ? 'Laci Kasir & Tutup Shift' : 'Cash Drawer & Shift Management'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'id'
                ? `Shift aktif dibuka pukul ${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} oleh ${currentShift.cashierName}`
                : `Active Shift opened at ${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${currentShift.cashierName}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMovementType('cash_in');
                setShowMovementModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>{language === 'id' ? 'Kas Masuk (Pay-In)' : 'Cash In (Pay-in)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMovementType('cash_out');
                setShowMovementModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>{language === 'id' ? 'Kas Keluar (Pay-Out)' : 'Cash Out (Pay-out)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCountedCash(expectedCashInDrawer.toString());
                setShowCloseShiftModal(true);
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              {language === 'id' ? 'Tutup Shift (Z-Report)' : 'Close Shift (Z-Report)'}
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'id' ? 'Uang di Laci' : 'Drawer Cash'}
              </span>
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(expectedCashInDrawer, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Modal ({formatCurrency(currentShift.startingFloat, config.currencySymbol, config.currencyCode)}) + Arus Kas
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'id' ? 'Penjualan Shift' : 'Gross Shift Sales'}
              </span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatCurrency(grossSales, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Semua metode pembayaran
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'id' ? 'Penjualan Tunai' : 'Cash Sales'}
              </span>
              <Banknote className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {formatCurrency(currentShift.cashSales, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Penerimaan fisik tunai
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'id' ? 'Kartu & QRIS' : 'Card & QR Sales'}
              </span>
              <CreditCard className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {formatCurrency(currentShift.cardSales + currentShift.qrSales, config.currencySymbol, config.currencyCode)}
            </div>
            <p className="text-[11px] text-slate-500">
              Kartu {formatCurrency(currentShift.cardSales, config.currencySymbol, config.currencyCode)} · QRIS {formatCurrency(currentShift.qrSales, config.currencySymbol, config.currencyCode)}
            </p>
          </div>
        </div>

        {/* Cash In / Out Audit Trail and Shift Balancing Formula */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{language === 'id' ? 'Rekonsiliasi Laci Kasir' : 'Cash Drawer Math'}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>1. Modal Awal (Float)</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  +{formatCurrency(currentShift.startingFloat, config.currencySymbol, config.currencyCode)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>2. Penjualan Tunai</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  +{formatCurrency(currentShift.cashSales, config.currencySymbol, config.currencyCode)}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span>3. Kas Masuk (Pay-in)</span>
                <span className="font-mono font-bold tabular-nums">
                  +{formatCurrency(totalCashIn, config.currencySymbol, config.currencyCode)}
                </span>
              </div>

              <div className="flex justify-between items-center text-rose-400">
                <span>4. Kas Keluar (Pay-out)</span>
                <span className="font-mono font-bold tabular-nums">
                  -{formatCurrency(totalCashOut, config.currencySymbol, config.currencyCode)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Saldo Akhir Seharusnya:</span>
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {formatCurrency(expectedCashInDrawer, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {language === 'id' ? 'Log Keluar-Masuk Kas' : 'Cash Movements Log'}
              </h3>
              <span className="text-xs text-slate-400">{currentShift.movements.length} catatan</span>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[300px]">
              {currentShift.movements.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  {language === 'id' ? 'Belum ada pergerakan kas masuk atau keluar pada shift ini.' : 'No cash adjustments recorded during this shift.'}
                </div>
              ) : (
                currentShift.movements.map(m => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${m.type === 'cash_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {m.type === 'cash_in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{m.reason}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} oleh {m.cashierName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${m.type === 'cash_in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.type === 'cash_in' ? '+' : '-'}{formatCurrency(m.amount, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Previous Closed Shifts (Z-Reports History) */}
        {shiftHistory.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>{language === 'id' ? 'Arsip Laporan Z-Report Shift Sebelumnya' : 'Past Closed Shifts (Archived Z-Reports)'}</span>
            </h3>

            <div className="divide-y divide-slate-800">
              {shiftHistory.map(session => (
                <div key={session.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white block">
                      Shift: {new Date(session.openedAt).toLocaleDateString()} {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.closedAt ? new Date(session.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Closed'}
                    </span>
                    <span className="text-slate-400">Kasir: {session.cashierName} · Modal: {formatCurrency(session.startingFloat, config.currencySymbol, config.currencyCode)}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Total Penjualan</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(session.cashSales + session.cardSales + session.qrSales, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Selisih Kas</span>
                      <span className={`font-mono font-bold ${(session.variance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(session.variance || 0) >= 0 ? `+${formatCurrency(session.variance || 0, config.currencySymbol, config.currencyCode)}` : `-${formatCurrency(Math.abs(session.variance || 0), config.currencySymbol, config.currencyCode)}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLastClosedReport(session)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Lihat Z-Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cash In / Out Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {movementType === 'cash_in' ? 'Catat Kas Masuk (Pay-In)' : 'Catat Kas Keluar (Pay-Out)'}
            </h3>

            <p className="text-xs text-slate-400">
              {movementType === 'cash_in'
                ? 'Tambah uang tunai ke laci kasir (cth: uang kembalian / setoran kas).'
                : 'Tarik uang tunai dari laci untuk keperluan kas kecil, pembayaran kurir, atau belanja bahan.'}
            </p>

            <form onSubmit={handleMovementSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Jumlah ({config.currencySymbol})</label>
                <input
                  type="number"
                  step={config.currencySymbol === 'Rp' ? '1000' : '0.01'}
                  min="0.01"
                  required
                  autoFocus
                  value={movementAmount}
                  onChange={e => setMovementAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Alasan / Keterangan</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={e => setMovementReason(e.target.value)}
                  placeholder={movementType === 'cash_in' ? 'e.g. Tambah pecahan 5.000 & 10.000' : 'e.g. Pembelian es batu darurat'}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 font-bold rounded-lg text-slate-950 transition-colors ${
                    movementType === 'cash_in' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
                  }`}
                >
                  Simpan Pergerakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift / Z-Report Count Modal */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-white">Tutup Shift & Z-Report</h3>
            <p className="text-xs text-slate-300">
              Silakan hitung fisik uang tunai di laci untuk merekonsiliasi selisih kas akhir shift.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Uang Seharusnya di Laci:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {formatCurrency(expectedCashInDrawer, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmCloseShift} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Uang Fisik Dihitung ({config.currencySymbol})</label>
                <input
                  type="number"
                  step={config.currencySymbol === 'Rp' ? '100' : '0.01'}
                  min="0"
                  required
                  autoFocus
                  value={countedCash}
                  onChange={e => setCountedCash(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-base font-mono font-bold text-white focus:outline-hidden focus:border-amber-400"
                />

                {countedCash && (
                  <div className="mt-2 text-xs flex justify-between font-mono">
                    <span className="text-slate-400">Selisih (Lebih/Kurang):</span>
                    <span className={`font-bold ${
                      parseFloat(countedCash) - expectedCashInDrawer >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {parseFloat(countedCash) - expectedCashInDrawer >= 0
                        ? `+${formatCurrency(parseFloat(countedCash) - expectedCashInDrawer, config.currencySymbol, config.currencyCode)} (Pas/Lebih)`
                        : `-${formatCurrency(Math.abs(parseFloat(countedCash) - expectedCashInDrawer), config.currencySymbol, config.currencyCode)} (Kurang)`}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Catatan Shift (Opsional)</label>
                <input
                  type="text"
                  value={closingNote}
                  onChange={e => setClosingNote(e.target.value)}
                  placeholder="e.g. Tutup shift malam lancar, laci seimbang"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Cetak & Arsipkan Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Z-Report Display Modal */}
      {lastClosedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-md w-full my-auto flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-white px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                LAPORAN RESMI Z-REPORT
              </span>
              <button
                onClick={() => setLastClosedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div
              id="thermal-receipt-print-area"
              className="w-full bg-[#fbfbf8] text-slate-900 rounded-lg p-6 shadow-2xl font-mono text-xs border border-stone-200 select-text leading-relaxed"
            >
              <div className="text-center pb-3 border-b border-dashed border-stone-400">
                <h3 className="text-sm font-bold uppercase">{config.storeName}</h3>
                <p className="text-[11px] font-bold text-stone-700">*** LAPORAN TUTUP BUKU Z-REPORT ***</p>
                <p className="text-[10px] text-stone-500 mt-1">Dicetak: {new Date().toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-stone-500">Kasir: {lastClosedReport.cashierName}</p>
              </div>

              <div className="py-3 border-b border-dashed border-stone-300 space-y-1">
                <div className="flex justify-between">
                  <span>Modal Awal (Float):</span>
                  <span className="tabular-nums">{formatCurrency(lastClosedReport.startingFloat, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Tunai:</span>
                  <span className="tabular-nums">+{formatCurrency(lastClosedReport.cashSales, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Kartu:</span>
                  <span className="tabular-nums">+{formatCurrency(lastClosedReport.cardSales, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan QRIS:</span>
                  <span className="tabular-nums">+{formatCurrency(lastClosedReport.qrSales, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                  <span>TOTAL PENJUALAN KOTOR:</span>
                  <span className="tabular-nums">{formatCurrency(lastClosedReport.cashSales + lastClosedReport.cardSales + lastClosedReport.qrSales, config.currencySymbol, config.currencyCode)}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-stone-300 space-y-1">
                <div className="flex justify-between">
                  <span>Kas Fisik Dihitung:</span>
                  <span className="tabular-nums font-bold">{formatCurrency(lastClosedReport.countedCashAtClose || 0, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1">
                  <span>SELISIH KAS (OVER/SHORT):</span>
                  <span className="tabular-nums">
                    {(lastClosedReport.variance || 0) >= 0 ? `+${formatCurrency(lastClosedReport.variance || 0, config.currencySymbol, config.currencyCode)}` : `-${formatCurrency(Math.abs(lastClosedReport.variance || 0), config.currencySymbol, config.currencyCode)}`}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-stone-500">
                <p>Mesin Kasir AfzPOS Terminal #01</p>
                <p>Register Tersegel & Terarsip</p>
              </div>
            </div>

            {whatsappStatus && (
              <div
                className={`w-full mt-3 p-3 rounded-lg border text-xs flex items-center justify-between ${
                  whatsappStatus.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-600/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                    className="p-1 text-emerald-400 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            <div className="w-full flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleSendWhatsAppShiftReport}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>Kirim WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => void printOrShareReport(buildShiftReportLines(lastClosedReport, config), config)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLastClosedReport(null);
                  setWhatsappStatus(null);
                }}
                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
