import React, { useState, useMemo, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, WeightUnit } from '../../types/pos';
import { INITIAL_CATEGORIES, APP_GALLERY_IMAGES, GalleryImage } from '../../utils/mockData';
import { formatCurrency } from '../../utils/format';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  Tag,
  DollarSign,
  Hash,
  Scale,
  SlidersHorizontal,
  Flame,
  Image as ImageIcon,
  Upload,
  X,
  Check
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, config, t } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Low stock reorder filter & threshold settings
  const [reorderThreshold, setReorderThreshold] = useState<number>(config.lowStockDefaultThreshold || 15);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Product modal (Add / Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // App Gallery Picker modal
  const [showAppGalleryModal, setShowAppGalleryModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('coffee');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [minStockThreshold, setMinStockThreshold] = useState('15');
  const [description, setDescription] = useState('');
  const [hasTax, setHasTax] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Count items needing reorder
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= (p.minStockThreshold || reorderThreshold)).length;
  }, [products, reorderThreshold]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const threshold = p.minStockThreshold || reorderThreshold;
      const needsReorder = p.stock <= threshold;

      if (filterLowStockOnly && !needsReorder) {
        return false;
      }

      const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search, filterLowStockOnly, reorderThreshold]);

  const handleOpenNew = () => {
    setEditingProductId(null);
    setName('');
    const randomNum = Math.floor(100 + Math.random() * 900);
    setSku(`SKU-${randomNum}`);
    setBarcode(`890100${randomNum}`);
    setCategoryId('coffee');
    setPrice(config.currencySymbol === 'Rp' ? '25000' : '4.50');
    setCostPrice(config.currencySymbol === 'Rp' ? '10000' : '1.20');
    setStock('50');
    setWeight('');
    setWeightUnit('g');
    setMinStockThreshold('15');
    setDescription('');
    setHasTax(true);
    setImageUrl('');
    setShowProductModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setSku(product.sku);
    setBarcode(product.barcode);
    setCategoryId(product.categoryId);
    setPrice(product.price.toString());
    setCostPrice(product.costPrice ? product.costPrice.toString() : '');
    setStock(product.stock.toString());
    setWeight(product.weight !== undefined ? product.weight.toString() : '');
    setWeightUnit(product.weightUnit || 'g');
    setMinStockThreshold((product.minStockThreshold || 15).toString());
    setDescription(product.description || '');
    setHasTax(product.hasTax);
    setImageUrl(product.image || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    const costNum = parseFloat(costPrice) || undefined;
    const weightNum = parseFloat(weight);
    const minThresholdNum = parseInt(minStockThreshold, 10);

    if (isNaN(priceNum) || priceNum <= 0) return;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name,
        sku,
        barcode: barcode || `890100${Math.floor(100 + Math.random() * 900)}`,
        categoryId,
        price: priceNum,
        costPrice: costNum,
        stock: isNaN(stockNum) ? 0 : stockNum,
        weight: isNaN(weightNum) ? undefined : weightNum,
        weightUnit: isNaN(weightNum) ? undefined : weightUnit,
        minStockThreshold: isNaN(minThresholdNum) ? 15 : minThresholdNum,
        description,
        hasTax,
        image: imageUrl.trim() || undefined
      });
    } else {
      addProduct({
        name,
        sku,
        barcode: barcode || `890100${Math.floor(100 + Math.random() * 900)}`,
        categoryId,
        price: priceNum,
        costPrice: costNum,
        stock: isNaN(stockNum) ? 0 : stockNum,
        weight: isNaN(weightNum) ? undefined : weightNum,
        weightUnit: isNaN(weightNum) ? undefined : weightUnit,
        minStockThreshold: isNaN(minThresholdNum) ? 15 : minThresholdNum,
        description,
        hasTax,
        available: true,
        image: imageUrl.trim() || undefined
      });
    }
    setShowProductModal(false);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              {t('catalogTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('catalogSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addNewProduct')}</span>
            </button>
          </div>
        </div>

        {/* Low Stock Reorder Alert Banner */}
        {lowStockCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{t('reorderBannerTitle')}</span>
                  <span className="bg-amber-400 text-slate-950 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {lowStockCount} {config.language === 'id' ? 'produk' : 'items'}
                  </span>
                </h4>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  {lowStockCount} {t('reorderBannerDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  filterLowStockOnly
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {filterLowStockOnly
                    ? (config.language === 'id' ? 'Tampilkan Semua Produk' : 'Show All Items')
                    : (config.language === 'id' ? `Tampilkan Butuh Reorder (${lowStockCount})` : `Filter Needs Reorder (${lowStockCount})`)}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Category & Low Stock Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {/* Quick Reorder Filter Toggle Pill */}
            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                  filterLowStockOnly
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('filterReorder')}</span>
                <span className={`px-1 rounded text-[10px] font-mono font-bold ${
                  filterLowStockOnly ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/30 text-amber-200'
                }`}>
                  {lowStockCount}
                </span>
              </button>
            )}

            {INITIAL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCat(cat.id);
                  if (filterLowStockOnly) setFilterLowStockOnly(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === cat.id && !filterLowStockOnly
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {cat.id === 'all' ? t('allItems') : cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">{t('productNameLabel')}</th>
                  <th className="px-4 py-3.5">{t('skuLabel')}</th>
                  <th className="px-4 py-3.5">{t('category')}</th>
                  <th className="px-4 py-3.5 text-center">{t('weightLabel')}</th>
                  <th className="px-4 py-3.5 text-right">{t('priceLabel')}</th>
                  <th className="px-4 py-3.5 text-center">{t('stockLabel')}</th>
                  <th className="px-4 py-3.5 text-center">{t('statusLabel')}</th>
                  <th className="px-4 py-3.5 text-right">{t('actionsLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map(prod => {
                  const threshold = prod.minStockThreshold || reorderThreshold;
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock <= threshold && !isOutOfStock;
                  const needsReorder = prod.stock <= threshold;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isOutOfStock
                          ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-4 border-l-rose-500'
                          : isLowStock
                          ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Name & Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/50">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">
                                POS
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{prod.name}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">{prod.description || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 font-mono font-bold text-amber-400/90">
                        <div>{prod.sku}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{prod.barcode}</div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 capitalize text-slate-300">
                        {prod.categoryId}
                      </td>

                      {/* Weight / Unit of Weight */}
                      <td className="px-4 py-3 text-center">
                        {prod.weight ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 font-mono font-semibold text-slate-200 text-[11px]">
                            <Scale className="w-3 h-3 text-amber-400" />
                            {prod.weight} {prod.weightUnit || 'g'}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white tabular-nums">
                        {formatCurrency(prod.price, config.currencySymbol, config.currencyCode)}
                      </td>

                      {/* Stock Stepper */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(prod.id, prod.stock - 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono font-bold"
                          >
                            -
                          </button>
                          <span className={`w-12 text-center font-mono font-bold ${
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}>
                            {prod.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStock(prod.id, prod.stock + 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status & Reorder Notification Badge */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateProduct(prod.id, { available: !prod.available })}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                              prod.available && !isOutOfStock
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {prod.available && !isOutOfStock ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>{t('activeStatus')}</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isOutOfStock ? t('soldOut') : t('inactiveStatus')}</span>
                              </>
                            )}
                          </button>

                          {/* Reorder Notification Highlight Badge */}
                          {needsReorder && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            }`}>
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span>{isOutOfStock ? t('soldOut') : `${t('reorderNeeded')} (≤${threshold})`}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions (Edit & Delete) */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={t('editProduct')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title={t('deleteProduct')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <h3 className="text-base font-bold text-white">
              {editingProductId ? t('editProduct') : t('addNewProduct')}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Name */}
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('productNameLabel')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Es Kopi Susu Aren / Croissant"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* 2. Price */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('priceLabel')} ({config.currencySymbol}) *</span>
                  </label>
                  <input
                    type="number"
                    step={config.currencySymbol === 'Rp' ? '100' : '0.01'}
                    min="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder={config.currencySymbol === 'Rp' ? '25000' : '4.50'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* 3. SKU */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('skuLabel')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. COF-101"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{t('barcodeLabel')}</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="890100101"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{t('category')}</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                  >
                    {INITIAL_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{t('stockLabel')} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Reorder Alert Threshold */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('minStockThresholdLabel')}</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockThreshold}
                    onChange={e => setMinStockThreshold(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {config.language === 'id' ? 'Beri peringatan saat stok ≤ angka ini' : 'Alert when stock falls to or below this'}
                  </span>
                </div>

                {/* Weight / Volume (Unit of Weight) */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('weightLabel')}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <select
                      value={weightUnit}
                      onChange={e => setWeightUnit(e.target.value as WeightUnit)}
                      className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="g">Gram (g)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="ml">Mililiter (ml)</option>
                      <option value="l">Liter (l)</option>
                      <option value="oz">Ounce (oz)</option>
                      <option value="lb">Pound (lb)</option>
                      <option value="pcs">Pieces (pcs)</option>
                    </select>
                  </div>
                </div>

                {/* Cost price */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Cost Price ({config.currencySymbol})</label>
                  <input
                    type="number"
                    step={config.currencySymbol === 'Rp' ? '100' : '0.01'}
                    min="0"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Product Image Selection via App Gallery & Device Upload */}
                <div className="col-span-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{config.language === 'id' ? 'Foto Produk (Galeri App & Perangkat)' : 'Product Image (App Gallery & Upload)'}</span>
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>{config.language === 'id' ? 'Hapus Foto' : 'Remove Image'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Image Preview Box */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Option 1: Choose from App Gallery */}
                        <button
                          type="button"
                          onClick={() => setShowAppGalleryModal(true)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{config.language === 'id' ? 'Pilih dari Galeri App' : 'Choose from App Gallery'}</span>
                        </button>

                        {/* Option 2: Upload from Device Gallery */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>{config.language === 'id' ? 'Unggah dari Galeri HP/PC' : 'Upload from Device Gallery'}</span>
                        </button>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleDeviceImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      <input
                        type="text"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder={config.language === 'id' ? 'Atau tempel URL gambar langsung...' : 'Or paste direct image URL...'}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-mono text-[11px] text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-semibold">{config.language === 'id' ? 'Deskripsi Singkat' : 'Description'}</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Short product note..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  {t('saveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">{t('deleteProduct')}</h3>
            </div>

            <p className="text-xs text-slate-300">
              {t('deleteConfirm')} <br />
              <span className="font-semibold text-white mt-1 block">
                "{productToDelete.name}" ({productToDelete.sku})
              </span>
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {t('deleteProduct')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Gallery Image Picker Modal */}
      {showAppGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl border border-amber-400/20">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {config.language === 'id' ? 'Galeri Foto Aplikasi' : 'App Photo Gallery'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {config.language === 'id' ? 'Pilih dari foto produk berkualitas tinggi yang tersedia' : 'Choose from high-quality curated preset catalog photography'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppGalleryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1 scrollbar-thin">
              {APP_GALLERY_IMAGES.map(img => {
                const isSelected = imageUrl === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setImageUrl(img.url);
                      setShowAppGalleryModal(false);
                    }}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all p-2 flex flex-col ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 mb-2 border border-slate-700/50">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-white block truncate">{img.name}</span>
                        <span className="text-[10px] text-amber-400/90 font-medium">{img.category}</span>
                      </div>

                      {isSelected && (
                        <span className="p-1 rounded-full bg-amber-400 text-slate-950 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAppGalleryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
