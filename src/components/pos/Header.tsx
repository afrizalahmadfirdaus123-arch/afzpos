import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { bluetoothPrinter, BluetoothPrinterState } from '../../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import {
  Settings as SettingsIcon,
  ShoppingCart,
  Package,
  BarChart3,
  Receipt,
  Banknote,
  Grid,
  Bluetooth
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    parkedOrders,
    clearCart,
    cart,
    language,
    setLanguage,
    config,
    setCurrencyPreset,
    t
  } = usePOS();

  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(bluetoothPrinter.getState());

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(setBtState);
    return () => unsub();
  }, []);

  return (
    <>
      <header className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 select-none overflow-x-auto scrollbar-none">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('register')}
            className="text-base sm:text-lg font-bold tracking-tight text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
            {t('appName')}
          </button>
        </div>

        {/* Zone 2: Navigation Links (Always visible and scrollable if viewport is narrow) */}
        <nav className="flex items-center gap-2 sm:gap-4 md:gap-5 text-xs sm:text-sm font-medium text-slate-300 shrink-0 overflow-x-auto scrollbar-none py-1">
          {/* Register */}
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'register'
                ? 'text-white border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{t('register')}</span>
          </button>

          {/* Product Catalog */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'inventory'
                ? 'text-white border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{t('inventory')}</span>
          </button>

          {/* Sales Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'reports'
                ? 'text-white border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t('reports')}</span>
          </button>

          {/* Orders & Tabs (with Live Cart Items Badge!) */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'orders'
                ? 'text-white border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t('orders')}</span>
            {cart.length > 0 && (
              <span className="font-mono bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-bold">
                {cart.length}
              </span>
            )}
          </button>

          {/* Cash Drawer & Shift */}
          <button
            onClick={() => setActiveTab('drawer')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'drawer'
                ? 'text-white border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>{t('drawer')}</span>
          </button>

          {/* Settings Tab - Always clearly visible and prominent! */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 px-1.5 ${
              activeTab === 'settings'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                : 'text-slate-300 hover:text-amber-300 font-semibold'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>{t('settings')}</span>
          </button>
        </nav>

        {/* Zone 3: Bluetooth Printer, Quick Language/Currency Toggles & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Bluetooth Thermal Printer Quick Toggle */}
          <button
            type="button"
            onClick={() => setShowPrinterModal(true)}
            title={
              btState.isConnected
                ? `Printer: ${btState.deviceName || 'ESC/POS BLE'}`
                : language === 'id' ? 'Hubungkan Printer Bluetooth' : 'Connect Bluetooth Printer'
            }
            className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              btState.isConnected
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
            <span className={`w-1.5 h-1.5 rounded-full ${btState.isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="hidden xl:inline text-[11px]">
              {btState.isConnected ? (language === 'id' ? 'Printer OK' : 'Printer On') : 'Printer'}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                language === 'id' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                language === 'en' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setCurrencyPreset('IDR')}
              className={`px-2 py-1 text-[11px] font-bold font-mono rounded transition-colors ${
                config.currencySymbol === 'Rp' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rp
            </button>
            <button
              type="button"
              onClick={() => setCurrencyPreset('USD')}
              className={`px-2 py-1 text-[11px] font-bold font-mono rounded transition-colors ${
                config.currencySymbol === '$' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              $
            </button>
          </div>

          {/* Primary Action Button */}
          {parkedOrders.length > 0 && activeTab !== 'orders' ? (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>{t('heldOrders')}</span>
              <span className="font-mono bg-amber-500/50 px-1.5 py-0.2 rounded text-[11px] text-amber-950">
                {parkedOrders.length}
              </span>
            </button>
          ) : cart.length > 0 ? (
            <button
              onClick={clearCart}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t('resetTicket')}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('settings')}
              title="Buka Pengaturan"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Bluetooth Printer Pairing Modal */}
      {showPrinterModal && (
        <BluetoothPrinterModal onClose={() => setShowPrinterModal(false)} />
      )}
    </>
  );
};
