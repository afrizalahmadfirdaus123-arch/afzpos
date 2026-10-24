import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { INITIAL_CATEGORIES, INITIAL_DISCOUNTS } from '../../utils/mockData';
import { Product, DiningOption } from '../../types/pos';
import { formatCurrency } from '../../utils/format';
import { ItemCustomizerModal } from './ItemCustomizerModal';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  Tag,
  DollarSign,
  Coffee,
  Croissant,
  Utensils,
  CupSoda,
  Package,
  Grid
} from 'lucide-react';

interface RegisterViewProps {
  onOpenPayment: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onOpenPayment }) => {
  const {
    products,
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    config,
    diningOption,
    setDiningOption,
    tableOrCustomer,
    setTableOrCustomer,
    activeDiscount,
    applyDiscount,
    tipAmount,
    setTipAmount,
    parkCurrentOrder,
    scanBarcode,
    addCustomItem,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    t
  } = usePOS();

  // Selected product for customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Manual barcode/sku dialog state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  // Open ring custom item state
  const [showCustomRingModal, setShowCustomRingModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemTax, setCustomItemTax] = useState(true);

  // Discount modal state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [customDiscountType, setCustomDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [customDiscountVal, setCustomDiscountVal] = useState('');

  // Tip modal state
  const [showTipModal, setShowTipModal] = useState(false);
  const [customTipVal, setCustomTipVal] = useState('');

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle product click
  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) return;
    if (product.modifiers && product.modifiers.length > 0) {
      setCustomizingProduct(product);
    } else {
      addToCart(product);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const success = scanBarcode(barcodeInput);
    if (success) {
      setBarcodeFeedback(`Scanned SKU/Barcode: ${barcodeInput}`);
      setBarcodeInput('');
      setTimeout(() => {
        setBarcodeFeedback(null);
        setShowBarcodeModal(false);
      }, 700);
    } else {
      setBarcodeFeedback('Item not found or out of stock');
    }
  };

  const handleCustomRingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;
    addCustomItem(customItemName || 'Custom Item', priceNum, customItemTax);
    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomRingModal(false);
  };

  const handleApplyCustomDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customDiscountVal);
    if (isNaN(val) || val <= 0) return;
    applyDiscount({
      id: 'custom_discount',
      label: customDiscountType === 'percentage' ? `${val}% Diskon` : `${formatCurrency(val, config.currencySymbol, config.currencyCode)} Diskon`,
      type: customDiscountType,
      value: val
    });
    setCustomDiscountVal('');
    setShowDiscountModal(false);
  };

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'Croissant':
        return <Croissant className="w-3.5 h-3.5" />;
      case 'Utensils':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'CupSoda':
        return <CupSoda className="w-3.5 h-3.5" />;
      case 'Package':
        return <Package className="w-3.5 h-3.5" />;
      default:
        return <Grid className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-53px)] overflow-hidden">
      {/* LEFT SECTION: Catalog, Search, Categories, Product Cards */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 border-r border-slate-800">
        {/* Search Bar & Fast Utility Controls */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 shrink-0 bg-slate-900/60">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBarcodeModal(true)}
            title="Scan Barcode / Enter SKU"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-400 hover:border-slate-600 transition-colors whitespace-nowrap"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">{t('barcode')}</span>
          </button>

          <button
            onClick={() => setShowCustomRingModal(true)}
            title="Open Ring Custom Item"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-400 hover:border-slate-600 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('customRing')}</span>
          </button>
        </div>

        {/* Category Horizontal Filter Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none bg-slate-900/40">
          {INITIAL_CATEGORIES.map(category => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {renderCategoryIcon(category.icon)}
                <span>{category.id === 'all' ? t('allItems') : category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Package className="w-10 h-10 mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">{t('noItemsFound')}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300 hover:text-white"
                >
                  {t('clearSearch')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleProductClick(product)}
                    className={`group relative flex flex-col text-left bg-slate-900 border border-slate-800/90 rounded-xl overflow-hidden transition-all duration-150 ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:border-slate-700 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0 active:scale-[0.99]'
                    }`}
                  >
                    {/* Product Image Slot */}
                    <div className="relative aspect-4/3 w-full bg-slate-800/80 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
                          <Package className="w-8 h-8 stroke-1 mb-1 text-slate-600" />
                          <span className="text-[10px] uppercase font-mono text-slate-500">{product.sku}</span>
                        </div>
                      )}

                      {/* Stock badge */}
                      {product.stock <= (product.minStockThreshold || 15) && product.stock > 0 && (
                        <div className="absolute top-2 right-2 bg-amber-500/90 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs animate-pulse">
                          {product.stock} {t('leftInStock')}
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{t('soldOut')}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-mono mb-1">
                          <span>{product.sku}</span>
                          <div className="flex items-center gap-1">
                            {product.weight && (
                              <span className="text-[10px] text-slate-300 font-medium bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60">
                                {product.weight}{product.weightUnit || 'g'}
                              </span>
                            )}
                            {product.modifiers && product.modifiers.length > 0 && (
                              <span className="text-[10px] text-amber-400/90 font-medium">Opsi</span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                          {formatCurrency(product.price, config.currencySymbol, config.currencyCode)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {product.hasTax ? t('taxable') : t('nonTax')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: The Register Order Ticket */}
      <div className="w-full lg:w-[420px] xl:w-[460px] bg-slate-900 flex flex-col shrink-0 border-t lg:border-t-0 border-slate-800">
        {/* Ticket Header */}
        <div className="p-4 border-b border-slate-800 shrink-0 space-y-3 bg-slate-900/90">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{t('activeTicket')}</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {t('currentOrder')}
              </h3>
            </div>

            {/* Dining Options Segmented Controls */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700/80">
              {(['dine_in', 'takeaway', 'delivery'] as DiningOption[]).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDiningOption(opt)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
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

          {/* Table / Customer Name input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tableOrCustomer}
              onChange={e => setTableOrCustomer(e.target.value)}
              placeholder={t('customerOrTable')}
              className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-800 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-xs font-semibold text-slate-400">{t('emptyCartTitle')}</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-[220px]">
                {t('emptyCartDesc')}
              </p>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = item.finalPrice * item.quantity;
              return (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-slate-800/60 border border-slate-800 rounded-lg flex flex-col gap-1.5 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                        {item.weight && item.weightUnit && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-800/40 shrink-0">
                            {item.weight} {item.weightUnit}
                          </span>
                        )}
                        {!item.hasTax && (
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{t('nonTax')}</span>
                        )}
                      </div>

                      {item.selectedModifiers.length > 0 && (
                        <div className="text-[11px] text-amber-400/80 flex flex-wrap gap-1 mt-0.5">
                          {item.selectedModifiers.map((mod, idx) => (
                            <span key={mod.modifierId}>
                              {mod.name}
                              {idx < item.selectedModifiers.length - 1 && ' · '}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.itemNote && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          Note: "{item.itemNote}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-white tabular-nums">
                        {formatCurrency(lineTotal, config.currencySymbol, config.currencyCode)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 font-mono">
                        @{formatCurrency(item.finalPrice, config.currencySymbol, config.currencyCode)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Financial Calculation & Quick Adjustments */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                activeDiscount
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{activeDiscount ? activeDiscount.label : t('addDiscount')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTipModal(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                tipAmount > 0
                  ? 'bg-emerald-400/10 border-emerald-400 text-emerald-300 font-semibold'
                  : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{tipAmount > 0 ? `${t('tip')}: ${formatCurrency(tipAmount, config.currencySymbol, config.currencyCode)}` : t('addTip')}</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 pt-1">
            <div className="flex justify-between items-center">
              <span>{t('subtotal')}</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {formatCurrency(subtotal, config.currencySymbol, config.currencyCode)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-amber-400">
                <span>{t('discount')} ({activeDiscount?.label})</span>
                <span className="font-mono tabular-nums">
                  -{formatCurrency(discountAmount, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span>{t('tax')} ({config.taxRate}%)</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {formatCurrency(taxAmount, config.currencySymbol, config.currencyCode)}
              </span>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-400">
                <span>{t('tip')}</span>
                <span className="font-mono tabular-nums">
                  +{formatCurrency(tipAmount, config.currencySymbol, config.currencyCode)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">{t('grandTotal')}</span>
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {formatCurrency(total, config.currencySymbol, config.currencyCode)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={parkCurrentOrder}
              title="Park order tab to resume later"
              className="py-3 px-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>{t('holdTab')}</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={clearCart}
              title="Clear active order"
              className="py-3 px-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('void')}</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={onOpenPayment}
              className="col-span-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>{t('pay')}</span>
              <span className="font-mono tabular-nums">{formatCurrency(total, config.currencySymbol, config.currencyCode)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Customizer Modal */}
      {customizingProduct && (
        <ItemCustomizerModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Barcode className="w-4 h-4 text-amber-400" />
                Barcode / SKU Scanner
              </h3>
              <button
                onClick={() => {
                  setShowBarcodeModal(false);
                  setBarcodeFeedback(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Enter barcode or SKU..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />

              {barcodeFeedback && (
                <div className={`p-2 rounded-lg text-xs font-medium text-center ${barcodeFeedback.includes('not found') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {barcodeFeedback}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowBarcodeModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Scan & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Ring Custom Item Modal */}
      {showCustomRingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Custom Open Ring</h3>
              <button
                onClick={() => setShowCustomRingModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCustomRingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">Item Description</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  placeholder="e.g. Seasonal Pastry Special"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Price ({config.currencySymbol})</label>
                <input
                  type="number"
                  step={config.currencySymbol === 'Rp' ? '100' : '0.01'}
                  min="0.01"
                  required
                  autoFocus
                  value={customItemPrice}
                  onChange={e => setCustomItemPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="customTax"
                  checked={customItemTax}
                  onChange={e => setCustomItemTax(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="customTax" className="text-slate-300">
                  Apply Sales Tax ({config.taxRate}%)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomRingModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Ring to Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Selector Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{t('addDiscount')}</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Preset Discounts
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {INITIAL_DISCOUNTS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      applyDiscount(d);
                      setShowDiscountModal(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      activeDiscount?.id === d.id
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="font-mono">
                      {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value, config.currencySymbol, config.currencyCode)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleApplyCustomDiscount} className="pt-2 border-t border-slate-800 space-y-2.5">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Custom Discount
              </label>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCustomDiscountType('percentage')}
                    className={`px-2.5 py-1 text-xs rounded font-medium ${customDiscountType === 'percentage' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDiscountType('fixed')}
                    className={`px-2.5 py-1 text-xs rounded font-medium ${customDiscountType === 'fixed' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    {config.currencySymbol}
                  </button>
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={customDiscountVal}
                  onChange={e => setCustomDiscountVal(e.target.value)}
                  placeholder={customDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 10000'}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 justify-between pt-2">
                {activeDiscount && (
                  <button
                    type="button"
                    onClick={() => {
                      applyDiscount(null);
                      setShowDiscountModal(false);
                    }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove Discount
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tip Selector Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{t('addTip')}</h3>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0.05, 0.10, 0.15, 0.20].map(pct => {
                const calculatedTip = Math.round(subtotal * pct);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setTipAmount(calculatedTip);
                      setShowTipModal(false);
                    }}
                    className="py-2.5 px-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-xs font-bold text-amber-400">{pct * 100}%</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {formatCurrency(calculatedTip, config.currencySymbol, config.currencyCode)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block font-medium">Custom Tip Amount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={config.currencySymbol === 'Rp' ? '1000' : '0.25'}
                  min="0"
                  value={customTipVal}
                  onChange={e => setCustomTipVal(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setTipAmount(0);
                  setShowTipModal(false);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                No Tip
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(customTipVal);
                  if (!isNaN(val) && val >= 0) {
                    setTipAmount(val);
                  }
                  setShowTipModal(false);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Set Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
