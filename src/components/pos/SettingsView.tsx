import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Language } from '../../types/pos';
import { bluetoothPrinter, BluetoothPrinterState } from '../../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import { sendReportToWhatsApp, isInternetConnected } from '../../utils/whatsapp';
import { saveTextFile } from '../../utils/nativeBridge';
import {
  Settings,
  Store,
  DollarSign,
  Receipt,
  Volume2,
  VolumeX,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Bluetooth,
  Printer,
  MessageSquare,
  Send,
  Wifi,
  WifiOff,
  Clock,
  Phone,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Code
} from 'lucide-react';
import mobileAppCodeRaw from '../../mobile-export/App.tsx?raw';

export const SettingsView: React.FC = () => {
  const {
    config,
    updateConfig,
    resetAllData,
    products,
    ordersHistory,
    shiftHistory,
    generateSalesReport,
    language,
    setLanguage,
    setCurrencyPreset,
    t
  } = usePOS();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBtModal, setShowBtModal] = useState(false);
  const [showMobileCodeModal, setShowMobileCodeModal] = useState(false);
  const [copiedMobileCode, setCopiedMobileCode] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(bluetoothPrinter.getState());

  const handleCopyMobileCode = () => {
    navigator.clipboard.writeText(mobileAppCodeRaw);
    setCopiedMobileCode(true);
    setTimeout(() => setCopiedMobileCode(false), 2500);
  };

  const handleDownloadMobileCode = () => {
    void saveTextFile('App.tsx', mobileAppCodeRaw, 'text/typescript');
  };

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(setBtState);
    return () => {
      unsub();
    };
  }, []);

  // Form local state
  const [storeName, setStoreName] = useState(config.storeName);
  const [taxRate, setTaxRate] = useState(config.taxRate.toString());
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(config.currencyCode);
  const [addressLine1, setAddressLine1] = useState(config.addressLine1);
  const [addressLine2, setAddressLine2] = useState(config.addressLine2);
  const [phone, setPhone] = useState(config.phone);
  const [receiptHeaderMsg, setReceiptHeaderMsg] = useState(config.receiptHeaderMsg);
  const [receiptFooterMsg, setReceiptFooterMsg] = useState(config.receiptFooterMsg);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [defaultCashier, setDefaultCashier] = useState(config.defaultCashier);

  // WhatsApp Automation State
  const [whatsappNumber, setWhatsappNumber] = useState(config.whatsappNumber || '+6281234567890');
  const [whatsappRecipientName, setWhatsappRecipientName] = useState(config.whatsappRecipientName || 'Owner AfzPOS');
  const [autoSendWhatsAppDaily, setAutoSendWhatsAppDaily] = useState(config.autoSendWhatsAppDaily ?? true);
  const [whatsappDailyTime, setWhatsappDailyTime] = useState(config.whatsappDailyTime || '21:00');
  const [lowStockDefaultThreshold, setLowStockDefaultThreshold] = useState((config.lowStockDefaultThreshold || 15).toString());
  const [whatsappFeedback, setWhatsappFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(isInternetConnected());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestSendWhatsApp = () => {
    const report = generateSalesReport('daily');
    const lowStockProds = products.filter(p => p.stock <= (p.minStockThreshold || 15));
    const result = sendReportToWhatsApp({
      report,
      config: {
        ...config,
        whatsappNumber,
        whatsappRecipientName
      },
      lowStockProducts: lowStockProds,
      periodLabel: language === 'id' ? 'Harian' : 'Daily'
    }, whatsappNumber);

    setWhatsappFeedback(result);
    setTimeout(() => setWhatsappFeedback(null), 5000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const taxNum = parseFloat(taxRate);
    const lowStockNum = parseInt(lowStockDefaultThreshold, 10);
    updateConfig({
      storeName,
      taxRate: isNaN(taxNum) ? 0 : taxNum,
      currencySymbol,
      currencyCode,
      addressLine1,
      addressLine2,
      phone,
      receiptHeaderMsg,
      receiptFooterMsg,
      soundEnabled,
      defaultCashier,
      whatsappNumber,
      whatsappRecipientName,
      autoSendWhatsAppDaily,
      whatsappDailyTime,
      lowStockDefaultThreshold: isNaN(lowStockNum) ? 15 : lowStockNum
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const backup = {
      config,
      products,
      ordersHistory,
      shiftHistory,
      exportedAt: new Date().toISOString()
    };
    void saveTextFile(
      `afzpos-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      'application/json'
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              {t('settingsTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'id' ? 'Atur bahasa, mata uang Rupiah, profil bisnis, dan pencetakan struk kasir' : 'Configure language, currency, store profile, and receipt branding'}
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('settingsSaved')}</span>
            </div>
          )}
        </div>

        {/* Section 0: Localization (Language & Currency Presets) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>{t('languageLabel')} & {t('currencyLabel')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Language Selection */}
            <div>
              <label className="text-slate-400 block mb-2 font-semibold">{t('languageLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                    language === 'id'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span>Bahasa Indonesia</span>
                  <span className="font-mono text-[10px] text-slate-400">ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                    language === 'en'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span>English (US)</span>
                  <span className="font-mono text-[10px] text-slate-400">EN</span>
                </button>
              </div>
            </div>

            {/* Currency Preset (Rupiah vs Dollar) */}
            <div>
              <label className="text-slate-400 block mb-2 font-semibold">{t('currencyLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrencyPreset('IDR');
                    setCurrencySymbol('Rp');
                    setCurrencyCode('IDR');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                    config.currencySymbol === 'Rp'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span>Rupiah (IDR)</span>
                  <span className="font-mono text-[10px] text-slate-400">Rp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrencyPreset('USD');
                    setCurrencySymbol('$');
                    setCurrencyCode('USD');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                    config.currencySymbol === '$'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span>US Dollar (USD)</span>
                  <span className="font-mono text-[10px] text-slate-400">$</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Settings Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Business Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              {language === 'id' ? 'Profil Toko & Bisnis' : 'Store & Business Profile'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Nama Toko / Brand' : 'Store / Brand Name'}</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Alamat Jalan' : 'Street Address'}</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Kota & Kode Pos' : 'City & Postal Code'}</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={e => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Nomor Telepon' : 'Telephone Number'}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Nama Kasir Bertugas' : 'Active Cashier Name'}</label>
                <input
                  type="text"
                  value={defaultCashier}
                  onChange={e => setDefaultCashier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Currency & Tax */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              {language === 'id' ? 'Pengaturan Pajak (PPN) & Simbol' : 'Tax & Currency Formatting'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Tarif Pajak Penjualan (%)' : 'Default Sales Tax Rate (%)'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  placeholder="11"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">{language === 'id' ? 'Standar PPN Indonesia adalah 11%' : 'Standard applied to taxable items'}</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{t('currencySymbol')}</label>
                <input
                  type="text"
                  maxLength={4}
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  placeholder="Rp"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">ISO Code</label>
                <input
                  type="text"
                  maxLength={5}
                  value={currencyCode}
                  onChange={e => setCurrencyCode(e.target.value.toUpperCase())}
                  placeholder="IDR"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Receipt Paper Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              {language === 'id' ? 'Kustomisasi Teks Struk Fisik' : 'Thermal Receipt Paper Customization'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Pesan Header Struk' : 'Receipt Header Note'}</label>
                <input
                  type="text"
                  value={receiptHeaderMsg}
                  onChange={e => setReceiptHeaderMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">{language === 'id' ? 'Pesan Footer Struk' : 'Receipt Footer Note'}</label>
                <input
                  type="text"
                  value={receiptFooterMsg}
                  onChange={e => setReceiptFooterMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: WhatsApp Daily Sales Report Automation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'id' ? 'Otomatisasi Laporan WhatsApp (Daily Report)' : 'WhatsApp Daily Sales Report Automation'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'id'
                    ? 'Kirim ringkasan omzet harian, transaksi, dan peringatan stok reorder otomatis ke nomor WhatsApp pemilik'
                    : 'Automatically transmit daily revenue, orders, and low stock reorder alerts to business WhatsApp'}
                </p>
              </div>

              {/* Internet Connectivity Status Badge */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'id' ? 'Terhubung Internet' : 'Online'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>{language === 'id' ? 'Offline (Tidak Ada Internet)' : 'Offline'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* WhatsApp Test Feedback Toast */}
            {whatsappFeedback && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                whatsappFeedback.success
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}>
                {whatsappFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{whatsappFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* WhatsApp Target Phone Number */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'id' ? 'Nomor WhatsApp Penerima' : 'Recipient WhatsApp Number'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="+6281234567890"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {language === 'id' ? 'Gunakan kode negara (cth: +62812... atau 62812...)' : 'Include country code (e.g. +62812... or +1...)'}
                </span>
              </div>

              {/* Recipient / Owner Name */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {language === 'id' ? 'Nama Pemilik / Penerima' : 'Recipient / Store Owner Name'}
                </label>
                <input
                  type="text"
                  value={whatsappRecipientName}
                  onChange={e => setWhatsappRecipientName(e.target.value)}
                  placeholder="e.g. Afrizal Ahmad / Owner"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              {/* Preferred Dispatch Time */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'id' ? 'Waktu Kirim Laporan Harian' : 'Scheduled Daily Send Time'}</span>
                </label>
                <input
                  type="time"
                  value={whatsappDailyTime}
                  onChange={e => setWhatsappDailyTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {language === 'id' ? 'Waktu pengiriman otomatis saat tutup shift malam' : 'Target delivery time for evening closeout'}
                </span>
              </div>

              {/* Default Low Stock Alert Threshold */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'id' ? 'Batas Minimum Reorder Global (Unit)' : 'Global Reorder Threshold (Units)'}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockDefaultThreshold}
                  onChange={e => setLowStockDefaultThreshold(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {language === 'id' ? 'Produk dengan stok di bawah angka ini akan dimasukkan ke peringatan WhatsApp' : 'Items under this threshold appear in WhatsApp alert'}
                </span>
              </div>
            </div>

            {/* Auto-send Toggle & Test Dispatch Button */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoSendWhatsAppDaily(!autoSendWhatsAppDaily)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoSendWhatsAppDaily ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${autoSendWhatsAppDaily ? 'bg-slate-950' : 'bg-white'}`} />
                </button>
                <span className="text-xs text-slate-300 font-semibold">
                  {language === 'id' ? 'Kirim Otomatis Saat Tutup Shift / Shift Close' : 'Auto-dispatch on shift closing'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestSendWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Kirim Laporan Harian ke WhatsApp Sekarang' : 'Send Daily Report to WhatsApp Now'}</span>
              </button>
            </div>
          </div>

          {/* Section 5: Bluetooth Thermal Printer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bluetooth className="w-4 h-4 text-blue-400" />
                  <span>{language === 'id' ? 'Printer Thermal Bluetooth (ESC/POS)' : 'Bluetooth Thermal Printer (ESC/POS)'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'id'
                    ? 'Koneksi nirkabel untuk printer kasir 58mm atau 80mm via Web Bluetooth'
                    : 'Wireless thermal printing for 58mm and 80mm mobile receipt printers'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  btState.isConnected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${btState.isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span>{btState.isConnected ? (btState.deviceName || 'Connected') : (language === 'id' ? 'Belum Terhubung' : 'Disconnected')}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowBtModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Kelola Printer' : 'Manage Printer'}</span>
                </button>
              </div>
            </div>

            {/* Paper Width Quick Selector */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {language === 'id' ? 'Format Lebar Kertas Struk:' : 'Thermal Paper Width:'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => bluetoothPrinter.setPaperWidth('58mm')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    btState.paperWidth === '58mm'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm (32 col)
                </button>
                <button
                  type="button"
                  onClick={() => bluetoothPrinter.setPaperWidth('80mm')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    btState.paperWidth === '80mm'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm (48 col)
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Hardware & Auditory Cues */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  {t('soundEffects')}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'id' ? 'Bunyi otentik laci kasir mekanik, pemindai barcode, dan notifikasi sukses' : 'Tactile auditory feedback for scanner beeps and cash drawer opening'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  soundEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${soundEnabled ? 'bg-slate-950' : 'bg-white'}`} />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              {t('saveConfiguration')}
            </button>
          </div>
        </form>

        {/* Mobile React Native + Expo Single-File Code Card */}
        <div className="p-5 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {language === 'id' ? 'Aplikasi Mobile: React Native + Expo (1 File)' : 'Mobile App: React Native + Expo (Single File)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  App.tsx Siap Pakai
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {language === 'id'
                  ? 'Seluruh logika kasir, katalog stok & gramasi, riwayat order, laporan penjualan otomatis WhatsApp, dan pengaturan telah dikemas dalam satu file utuh di /src/mobile-export/App.tsx.'
                  : 'Complete POS logic, inventory badges & weight units, order history, automated WhatsApp reporting, and settings bundled in a single file at /src/mobile-export/App.tsx.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowMobileCodeModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Code className="w-4 h-4" />
              <span>{language === 'id' ? 'Buka & Salin Kode App.tsx' : 'View & Copy App.tsx'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMobileCode}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{language === 'id' ? 'Unduh File App.tsx' : 'Download App.tsx'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMobileCode}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedMobileCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedMobileCode ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Cepat' : 'Quick Copy')}</span>
            </button>
          </div>
        </div>

        {/* Data & Backup Tools */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white">
            {language === 'id' ? 'Cadangan & Pemulihan Data' : 'Data Management & Backup'}
          </h3>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{language === 'id' ? 'Unduh Data POS (JSON)' : 'Export POS Data (JSON)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'id' ? 'Kembalikan ke Katalog Awal' : 'Reset to Sample Catalog'}</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Reset Terminal Data</h3>
              </div>

              <p className="text-xs text-slate-300">
                {language === 'id'
                  ? 'Apakah Anda yakin ingin mengatur ulang data terminal ke katalog awal?'
                  : 'This will reset the product catalog to default inventory. Are you sure?'}
              </p>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bluetooth Thermal Printer Pairing Modal */}
        {showBtModal && (
          <BluetoothPrinterModal onClose={() => setShowBtModal(false)} />
        )}

        {/* Mobile React Native Expo Code Modal */}
        {showMobileCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      React Native + Expo (App.tsx)
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                        Single File
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tersimpan di: <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">/src/mobile-export/App.tsx</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMobileCode}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedMobileCode ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedMobileCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMobileCode}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Unduh App.tsx</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMobileCodeModal(false)}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="px-6 py-3 bg-amber-950/20 border-b border-amber-500/20 text-xs text-slate-300 flex flex-wrap items-center gap-4">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  🚀 Cara Menjalankan di Expo:
                </span>
                <span className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800">
                  npx create-expo-app AfzPOS
                </span>
                <span className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800">
                  npx expo install @expo/vector-icons
                </span>
                <span className="text-slate-400">
                  Ganti seluruh isi <code className="text-amber-300">App.tsx</code> dengan kode di bawah ini, lalu jalankan <code className="text-emerald-400">npx expo start</code>.
                </span>
              </div>

              {/* Code Preview Viewer */}
              <div className="flex-1 min-h-0 bg-slate-950 p-4 overflow-y-auto">
                <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre selection:bg-amber-400 selection:text-slate-950 leading-relaxed">
                  {mobileAppCodeRaw}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
