import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, DiningOption } from '../../types/pos';
import { formatCurrency } from '../../utils/format';
import {
  Search,
  Receipt,
  RotateCcw,
  Play,
  Trash2,
  AlertCircle,
  ShoppingCart,
  Banknote,
  QrCode,
  CreditCard,
  Plus,
  Minus,
  ArrowRight,
  PauseCircle,
  Tag
} from 'lucide-react';

interface OrdersHistoryViewProps {
  onOpenPayment?: (method?: 'cash' | 'qr' | 'card') => void;
}

export const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({ onOpenPayment }) => {
  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    diningOption,
    setDiningOption,
    tableOrCustomer,
    setTableOrCustomer,
    parkCurrentOrder,
    ordersHistory,
    parkedOrders,
    resumeParkedOrder,
    deleteParkedOrder,
    refundOrder,
    setActiveReceiptOrder,
    setActiveTab: setAppActiveTab,
    config,
    t,
    language
  } = usePOS();

  // If cart has items, default to 'active_cart' tab so user sees items immediately!
  const [activeTab, setActiveTab] = useState<'active_cart' | 'completed' | 'parked'>(() => {
    return cart.length > 0 ? 'active_cart' : 'completed';
  });

  // Automatically switch to active_cart if items are added while viewing
  useEffect(() => {
    if (cart.length > 0 && activeTab === 'completed' && ordersHistory.length === 0) {
      setActiveTab('active_cart');
    }
  }, [cart.length, activeTab, ordersHistory.length]);

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Refund dialog state
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Filter completed orders
  const filteredCompletedOrders = ordersHistory.filter(order => {
    const q = search.toLowerCase();
    const matchesNum = order.formattedOrderNumber.toLowerCase().includes(q);
    const matchesCustomer = order.tableOrCustomer.toLowerCase().includes(q);
    const matchesMethod = order.paymentDetails.method.toLowerCase().includes(q);
    return matchesNum || matchesCustomer || matchesMethod;
  });

  const handleOpenRefund = (order: Order) => {
    setSelectedOrder(order);
    setRefundReason(language === 'id' ? 'Permintaan pembatalan pelanggan' : 'Customer requested refund / exchange');
    setShowRefundModal(true);
  };

  const handleConfirmRefund = () => {
    if (!selectedOrder) return;
    refundOrder(selectedOrder.id, refundReason.trim() || 'Refund processed');
    setShowRefundModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-53px)] overflow-hidden bg-slate-950">
      {/* LEFT LIST PANEL */}
      <div className="w-full md:w-[460px] lg:w-[500px] border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/60">
        {/* Navigation Tab Header: Active Cart, Completed, Parked */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{t('salesAndOrders')}</h2>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              {/* 1. Active Cart Tab (Fixes the issue where cart items were not shown here!) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active_cart');
                  setSelectedOrder(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'active_cart'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{t('activeCartTab')}</span>
                {cart.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    activeTab === 'active_cart' ? 'bg-amber-500/40 text-slate-950' : 'bg-amber-400 text-slate-950'
                  }`}>
                    {cart.length}
                  </span>
                )}
              </button>

              {/* 2. Completed Orders Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('completed');
                  setSelectedOrder(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('completedTab')} ({ordersHistory.length})
              </button>

              {/* 3. Parked Tabs */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('parked');
                  setSelectedOrder(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'parked'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('parkedTab')} ({parkedOrders.length})
              </button>
            </div>
          </div>

          {/* Search Bar for completed orders */}
          {activeTab === 'completed' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nomor tiket, nama, atau metode..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          )}

          {/* Quick Notice for Active Cart */}
          {activeTab === 'active_cart' && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>{cart.length} {t('itemsInCart')}</span>
              <button
                type="button"
                onClick={() => setAppActiveTab('register')}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Buka Menu Kasir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* ================= 1. ACTIVE CART ITEMS LIST ================= */}
          {activeTab === 'active_cart' && (
            cart.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="font-semibold text-slate-400">Keranjang Masih Kosong</p>
                <p className="text-slate-500">
                  Item yang ditambahkan ke pesanan dari tab Kasir akan tampil di sini.
                </p>
                <button
                  type="button"
                  onClick={() => setAppActiveTab('register')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                >
                  Pilih Menu di Kasir
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-xs">{item.quantity}x</span>
                          <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                          {!item.hasTax && (
                            <span className="text-[9px] font-mono text-slate-500 uppercase">{t('nonTax')}</span>
                          )}
                        </div>

                        {item.selectedModifiers.length > 0 && (
                          <div className="text-[11px] text-amber-400/80 pl-5 mt-0.5 space-x-1">
                            {item.selectedModifiers.map(m => (
                              <span key={m.modifierId}>• {m.name}</span>
                            ))}
                          </div>
                        )}

                        {item.itemNote && (
                          <div className="text-[11px] text-slate-400 italic pl-5 mt-0.5">
                            Note: "{item.itemNote}"
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-white tabular-nums">
                          {formatCurrency(item.finalPrice * item.quantity, config.currencySymbol, config.currencyCode)}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          @{formatCurrency(item.finalPrice, config.currencySymbol, config.currencyCode)}
                        </div>
                      </div>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ================= 2. COMPLETED ORDERS LIST ================= */}
          {activeTab === 'completed' && (
            filteredCompletedOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada transaksi terekam. Selesaikan penjualan untuk melihat riwayat di sini.
              </div>
            ) : (
              filteredCompletedOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const isRefunded = order.status === 'refunded';
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/80 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          {order.formattedOrderNumber}
                        </span>
                        {isRefunded ? (
                          <span className="text-[10px] font-bold text-rose-400 uppercase font-mono bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {t('refunded')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {order.paymentDetails.method === 'qr' ? 'QRIS' : order.paymentDetails.method.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                        {formatCurrency(order.total, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{order.tableOrCustomer} · {order.items.length} items</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                );
              })
            )
          )}

          {/* ================= 3. PARKED TABS LIST ================= */}
          {activeTab === 'parked' && (
            parkedOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada pesanan tertahan saat ini.
              </div>
            ) : (
              parkedOrders.map(order => (
                <div
                  key={order.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400 block">
                        {order.formattedOrderNumber}
                      </span>
                      <span className="text-xs font-medium text-white">{order.tableOrCustomer}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-white tabular-nums">
                      {formatCurrency(order.total, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-0.5">
                    {order.items.map(item => (
                      <div key={item.cartItemId} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono text-slate-500">
                          {formatCurrency(item.finalPrice * item.quantity, config.currencySymbol, config.currencyCode)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => resumeParkedOrder(order.id)}
                      className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Kembalikan ke Kasir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteParkedOrder(order.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Hapus tiket ditahan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* RIGHT DETAIL PANEL */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col bg-slate-950">
        {/* If Active Cart is selected, display live Cart Checkout Panel with instant Cash / QRIS buttons! */}
        {activeTab === 'active_cart' ? (
          cart.length > 0 ? (
            <div className="max-w-2xl w-full mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                    <span>Pesanan Aktif Sedang Berjalan</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {cart.length} menu siap ditransaksikan · Layanan: {diningOption.toUpperCase()} ({tableOrCustomer || 'Belum Bernama'})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={parkCurrentOrder}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('holdTab')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('void')}</span>
                  </button>
                </div>
              </div>

              {/* Service & Customer Name Editor */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Layanan:</span>
                  <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
                    {(['dine_in', 'takeaway', 'delivery'] as DiningOption[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDiningOption(opt)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          diningOption === opt
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt === 'dine_in' && t('dineIn')}
                        {opt === 'takeaway' && t('takeaway')}
                        {opt === 'delivery' && t('delivery')}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={tableOrCustomer}
                  onChange={e => setTableOrCustomer(e.target.value)}
                  placeholder={t('customerOrTable')}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Grand Total Calculation */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}:</span>
                    <span className="font-mono text-white tabular-nums">
                      {formatCurrency(subtotal, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>{t('discount')}:</span>
                      <span className="font-mono tabular-nums">
                        -{formatCurrency(discountAmount, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>{t('tax')} ({config.taxRate}%):</span>
                    <span className="font-mono text-white tabular-nums">
                      {formatCurrency(taxAmount, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">{t('grandTotal')}:</span>
                    <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                      {formatCurrency(total, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Instant 1-Click Payment Methods: Cash & QRIS */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Pilih Metode Pembayaran Cepat:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* CASH BUTTON */}
                    <button
                      type="button"
                      onClick={() => onOpenPayment && onOpenPayment('cash')}
                      className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>{t('payCash')} (Hitung Kembalian)</span>
                    </button>

                    {/* QRIS BUTTON */}
                    <button
                      type="button"
                      onClick={() => onOpenPayment && onOpenPayment('qr')}
                      className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{t('payQRIS')} (Pindai QR)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPayment && onOpenPayment('card')}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>Metode Lain (Kartu Kredit/Debit / Bagi Tagihan)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <ShoppingCart className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-sm font-bold text-slate-400">Keranjang Masih Kosong</h4>
              <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4">
                Pilih menu di tab Kasir untuk menambahkan pesanan, kemudian proses pembayaran dengan Tunai atau QRIS.
              </p>
              <button
                type="button"
                onClick={() => setAppActiveTab('register')}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs"
              >
                Buka Kasir Sekarang
              </button>
            </div>
          )
        ) : selectedOrder ? (
          /* ================= COMPLETED ORDER INSPECTOR ================= */
          <div className="max-w-2xl w-full mx-auto space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold font-mono text-white">
                    Pesanan {selectedOrder.formattedOrderNumber}
                  </h3>
                  {selectedOrder.status === 'refunded' ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {t('refunded')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SUKSES
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Waktu: {new Date(selectedOrder.createdAt).toLocaleString()} · Layanan: {selectedOrder.diningOption.toUpperCase()} ({selectedOrder.tableOrCustomer})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReceiptOrder(selectedOrder)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>{t('viewThermalReceipt')}</span>
                </button>

                {selectedOrder.status !== 'refunded' && (
                  <button
                    type="button"
                    onClick={() => handleOpenRefund(selectedOrder)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('refund')}</span>
                  </button>
                )}
              </div>
            </div>

            {selectedOrder.refundDetails && (
              <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-rose-300">
                    Pengembalian Dana Diproses pada {new Date(selectedOrder.refundDetails.refundedAt).toLocaleString()}
                  </p>
                  <p className="text-rose-200/80 mt-0.5">
                    Alasan: "{selectedOrder.refundDetails.reason}" · Disetujui oleh {selectedOrder.refundDetails.refundedBy}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                Rincian Menu ({selectedOrder.items.length})
              </div>

              <div className="divide-y divide-slate-800">
                {selectedOrder.items.map(item => (
                  <div key={item.cartItemId} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">{item.quantity}x</span>
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                      </div>

                      {item.selectedModifiers.length > 0 && (
                        <div className="text-xs text-slate-400 pl-6">
                          {item.selectedModifiers.map(m => (
                            <div key={m.modifierId}>• {m.name}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {formatCurrency(item.finalPrice * item.quantity, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Metode Pembayaran
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Metode:</span>
                  <span className="font-bold text-white uppercase">{selectedOrder.paymentDetails.method === 'qr' ? 'QRIS' : selectedOrder.paymentDetails.method}</span>
                </div>
                {selectedOrder.paymentDetails.amountTendered !== undefined && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Tunai Diterima:</span>
                      <span className="font-mono text-white">{formatCurrency(selectedOrder.paymentDetails.amountTendered, config.currencySymbol, config.currencyCode)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Kembalian:</span>
                      <span className="font-mono text-emerald-400">{formatCurrency(selectedOrder.paymentDetails.changeGiven || 0, config.currencySymbol, config.currencyCode)}</span>
                    </div>
                  </>
                )}
                {selectedOrder.paymentDetails.cardLast4 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Kartu:</span>
                    <span className="font-mono text-white">{selectedOrder.paymentDetails.cardBrand} *{selectedOrder.paymentDetails.cardLast4}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Rincian Tagihan
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-mono text-white">{formatCurrency(selectedOrder.subtotal, config.currencySymbol, config.currencyCode)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatCurrency(selectedOrder.discountAmount, config.currencySymbol, config.currencyCode)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Pajak ({selectedOrder.taxRate}%):</span>
                  <span className="font-mono text-white">{formatCurrency(selectedOrder.taxAmount, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-amber-400">{formatCurrency(selectedOrder.total, config.currencySymbol, config.currencyCode)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Receipt className="w-12 h-12 text-slate-700 mb-3" />
            <h4 className="text-sm font-bold text-slate-400">Pilih Tiket untuk Dilihat</h4>
            <p className="text-xs text-slate-600 max-w-sm mt-1">
              Klik salah satu transaksi pada daftar di kiri untuk melihat rincian pesanan dan cetak ulang struk.
            </p>
          </div>
        )}
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Pengembalian Dana {selectedOrder.formattedOrderNumber}</h3>
            </div>

            <p className="text-xs text-slate-300">
              Tindakan ini akan membatalkan penjualan dan mengembalikan <span className="font-mono font-bold text-white">{formatCurrency(selectedOrder.total, config.currencySymbol, config.currencyCode)}</span> kepada pelanggan, serta memulihkan stok inventaris.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Alasan Pengembalian</label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {t('confirmRefund')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
