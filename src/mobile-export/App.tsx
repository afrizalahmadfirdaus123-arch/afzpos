/// <reference path="./mobile-types.d.ts" />
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  Linking,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ==========================================
// 1. TIPE DATA & INTERFACE
// ==========================================
export type WeightUnit = 'g' | 'kg' | 'ml' | 'l' | 'oz' | 'lb' | 'pcs';
export type PaymentMethod = 'cash' | 'qris' | 'card';
export type SalesPeriod = 'daily' | 'weekly' | 'monthly';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockThreshold: number;
  weight?: number;
  weightUnit?: WeightUnit;
  image: string;
  description?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeGiven?: number;
  cashierName: string;
}

export interface StoreConfig {
  storeName: string;
  address: string;
  phone: string;
  cashierName: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number;
  whatsappNumber: string;
  whatsappRecipientName: string;
  autoSendWhatsAppDaily: boolean;
  lowStockDefaultThreshold: number;
}

// ==========================================
// 2. DATA AWAL (INITIAL MOCK DATA)
// ==========================================
const INITIAL_CONFIG: StoreConfig = {
  storeName: 'AfzPOS Coffee & Eatery',
  address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  phone: '+62 812-3456-7890',
  cashierName: 'Afrizal (Kasir 01)',
  currencySymbol: 'Rp',
  currencyCode: 'IDR',
  taxRate: 10,
  whatsappNumber: '+6281234567890',
  whatsappRecipientName: 'Owner AfzPOS',
  autoSendWhatsAppDaily: true,
  lowStockDefaultThreshold: 15
};

const CATEGORIES = [
  { id: 'all', name: 'Semua', icon: 'grid-outline' },
  { id: 'coffee', name: 'Kopi', icon: 'cafe-outline' },
  { id: 'non_coffee', name: 'Non-Kopi', icon: 'leaf-outline' },
  { id: 'bakery', name: 'Pastry & Food', icon: 'fast-food-outline' },
  { id: 'merch', name: 'Merchandise', icon: 'shirt-outline' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Espresso Romano Single',
    sku: 'ESP-001',
    barcode: '890100101',
    categoryId: 'coffee',
    price: 24000,
    costPrice: 8000,
    stock: 45,
    minStockThreshold: 15,
    weight: 30,
    weightUnit: 'ml',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Double shot espresso dengan sentuhan lemon zest segar.'
  },
  {
    id: 'prod-2',
    name: 'Vanilla Oat Flat White',
    sku: 'LAT-002',
    barcode: '890100102',
    categoryId: 'coffee',
    price: 38000,
    costPrice: 16000,
    stock: 32,
    minStockThreshold: 15,
    weight: 250,
    weightUnit: 'ml',
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
    description: 'Susu oat barista creamy dengan double shot espresso dan vanila Madagaskar.'
  },
  {
    id: 'prod-3',
    name: 'Iced Kyoto Matcha Latte',
    sku: 'MCH-003',
    barcode: '890100103',
    categoryId: 'non_coffee',
    price: 36000,
    costPrice: 14000,
    stock: 22,
    minStockThreshold: 15,
    weight: 350,
    weightUnit: 'ml',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    description: 'Matcha Uji Kyoto grade seremonial dipadu susu segar dingin.'
  },
  {
    id: 'prod-4',
    name: 'French Butter Croissant',
    sku: 'PAS-004',
    barcode: '890100104',
    categoryId: 'bakery',
    price: 28000,
    costPrice: 11000,
    stock: 6, // STOK RENDAH (< 15)
    minStockThreshold: 15,
    weight: 120,
    weightUnit: 'g',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    description: 'Croissant renyah berlapis dengan 100% mentega Normandy Prancis.'
  },
  {
    id: 'prod-5',
    name: 'Smoked Beef Truffle Panini',
    sku: 'FOD-005',
    barcode: '890100105',
    categoryId: 'bakery',
    price: 48000,
    costPrice: 22000,
    stock: 4, // STOK RENDAH (< 15)
    minStockThreshold: 15,
    weight: 220,
    weightUnit: 'g',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    description: 'Roti sourdough panggang dengan smoked beef brisket dan white truffle aioli.'
  },
  {
    id: 'prod-6',
    name: 'Whole Bean Ethiopia 250g',
    sku: 'BN-006',
    barcode: '890100106',
    categoryId: 'coffee',
    price: 135000,
    costPrice: 75000,
    stock: 3, // STOK RENDAH (< 15)
    minStockThreshold: 15,
    weight: 250,
    weightUnit: 'g',
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80',
    description: 'Biji kopi single-origin washed Yirgacheffe dengan aroma melati dan bergamot.'
  },
  {
    id: 'prod-7',
    name: 'Matte Black AfzPOS Tumbler',
    sku: 'MRC-007',
    barcode: '890100107',
    categoryId: 'merch',
    price: 185000,
    costPrice: 90000,
    stock: 2, // STOK RENDAH (< 10)
    minStockThreshold: 10,
    weight: 350,
    weightUnit: 'ml',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Tumbler vakum insulasi tahan panas 12 jam dan dingin 24 jam.'
  }
];

const formatMoney = (val: number, symbol: string = 'Rp') => {
  return `${symbol} ${val.toLocaleString('id-ID')}`;
};

// ==========================================
// 3. KOMPONEN UTAMA AFZPOS MOBILE
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'orders' | 'catalog' | 'reports' | 'settings'>('register');
  const [config, setConfig] = useState<StoreConfig>(INITIAL_CONFIG);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customerName, setCustomerName] = useState('Meja 01');

  // Filter & Pencarian
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modal State
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTenderInput, setCashTenderInput] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);

  // Form Tambah / Edit Produk
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('30');
  const [prodWeight, setProdWeight] = useState('');
  const [prodWeightUnit, setProdWeightUnit] = useState<WeightUnit>('g');
  const [prodMinThreshold, setProdMinThreshold] = useState('15');
  const [prodCategory, setProdCategory] = useState('coffee');

  // Bluetooth Printer Simulation
  const [printerConnected, setPrinterConnected] = useState(true);

  // Kalkulasi Total & Stok
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return Math.round((cartSubtotal * config.taxRate) / 100);
  }, [cartSubtotal, config.taxRate]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartTax;
  }, [cartSubtotal, cartTax]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= (p.minStockThreshold || config.lowStockDefaultThreshold)).length;
  }, [products, config.lowStockDefaultThreshold]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const isLow = p.stock <= (p.minStockThreshold || config.lowStockDefaultThreshold);
      if (filterLowStockOnly && !isLow) return false;
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly, config.lowStockDefaultThreshold]);

  // Aksi Keranjang
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Stok Habis', `Produk ${product.name} saat ini kosong.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Batas Stok', `Maksimal stok tersedia hanya ${product.stock}.`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartItemId: `cart-${Date.now()}-${Math.random()}`, quantity: 1 }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  // Aksi Checkout & Pembayaran
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Keranjang Kosong', 'Pilih produk terlebih dahulu.');
      return;
    }
    setCashTenderInput(cartTotal.toString());
    setShowPaymentModal(true);
  };

  const completePayment = () => {
    const tendered = parseFloat(cashTenderInput) || cartTotal;
    if (paymentMethod === 'cash' && tendered < cartTotal) {
      Alert.alert('Uang Kurang', 'Jumlah uang tunai kurang dari total tagihan.');
      return;
    }

    const change = paymentMethod === 'cash' ? Math.max(0, tendered - cartTotal) : 0;
    const now = new Date();

    const newOrder: OrderRecord = {
      id: `ORD-${Date.now()}`,
      orderNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString('id-ID'),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName || 'Pelanggan Umum',
      items: [...cart],
      subtotal: cartSubtotal,
      discount: 0,
      tax: cartTax,
      total: cartTotal,
      paymentMethod,
      amountTendered: paymentMethod === 'cash' ? tendered : undefined,
      changeGiven: paymentMethod === 'cash' ? change : undefined,
      cashierName: config.cashierName
    };

    // Pengurangan stok inventaris
    setProducts(prev =>
      prev.map(p => {
        const bought = cart.find(c => c.id === p.id);
        if (bought) {
          return { ...p, stock: Math.max(0, p.stock - bought.quantity) };
        }
        return p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setShowPaymentModal(false);
    setShowCartModal(false);
    setActiveReceipt(newOrder);
  };

  // Otomatisasi Laporan WhatsApp
  const sendWhatsAppReport = (customPhone?: string) => {
    const phone = customPhone || config.whatsappNumber;
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);

    const now = new Date();
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalTransactions = orders.length;
    const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const qrisTotal = orders.filter(o => o.paymentMethod === 'qris').reduce((s, o) => s + o.total, 0);
    const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);

    const lowItems = products.filter(p => p.stock <= (p.minStockThreshold || 15));

    let msg = `📊 *LAPORAN HARIAN PENJUALAN - AFZPOS*\n`;
    msg += `📅 *Tanggal*: ${now.toLocaleDateString('id-ID')}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    msg += `🏢 *Toko*: ${config.storeName}\n`;
    msg += `👤 *Kasir*: ${config.cashierName}\n`;
    msg += `─────────────────────────\n`;
    msg += `📈 *RINGKASAN PENJUALAN*\n`;
    msg += `• Total Omset: *${formatMoney(totalSales, config.currencySymbol)}*\n`;
    msg += `• Total Transaksi: *${totalTransactions} Pesanan*\n`;
    msg += `• Rata-rata Keranjang: ${formatMoney(totalTransactions ? Math.round(totalSales / totalTransactions) : 0, config.currencySymbol)}\n\n`;
    msg += `💳 *METODE PEMBAYARAN*\n`;
    msg += `• Tunai (Cash): ${formatMoney(cashTotal, config.currencySymbol)}\n`;
    msg += `• QRIS: ${formatMoney(qrisTotal, config.currencySymbol)}\n`;
    msg += `• Kartu Debit/Kredit: ${formatMoney(cardTotal, config.currencySymbol)}\n\n`;

    if (lowItems.length > 0) {
      msg += `⚠️ *PERINGATAN STOK RENDAH (< BATAS MINIMUM)*\n`;
      lowItems.forEach(p => {
        const weightLabel = p.weight && p.weightUnit ? ` (${p.weight}${p.weightUnit})` : '';
        msg += `• *${p.name}${weightLabel}*: Sisa *${p.stock}* (Min ${p.minStockThreshold}) - Segera Reorder!\n`;
      });
      msg += `\n`;
    }

    msg += `─────────────────────────\n`;
    msg += `_🤖 Dikirim otomatis oleh AfzPOS Mobile Terminal._`;

    const encoded = encodeURIComponent(msg);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    const webFallbackUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(webFallbackUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webFallbackUrl);
      });
  };

  // Tambah & Edit Produk
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setProdPrice('25000');
    setProdStock('30');
    setProdWeight('250');
    setProdWeightUnit('g');
    setProdMinThreshold('15');
    setProdCategory('coffee');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdPrice(p.price.toString());
    setProdStock(p.stock.toString());
    setProdWeight(p.weight ? p.weight.toString() : '');
    setProdWeightUnit(p.weightUnit || 'g');
    setProdMinThreshold(p.minStockThreshold.toString());
    setProdCategory(p.categoryId);
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    const priceNum = parseFloat(prodPrice);
    const stockNum = parseInt(prodStock, 10);
    const weightNum = parseFloat(prodWeight);
    const minThresholdNum = parseInt(prodMinThreshold, 10);

    if (!prodName.trim()) {
      Alert.alert('Validasi', 'Nama produk tidak boleh kosong.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validasi', 'Harga produk harus lebih dari 0.');
      return;
    }

    if (editingProductId) {
      setProducts(prev =>
        prev.map(item =>
          item.id === editingProductId
            ? {
                ...item,
                name: prodName,
                sku: prodSku,
                price: priceNum,
                stock: isNaN(stockNum) ? 0 : stockNum,
                weight: isNaN(weightNum) ? undefined : weightNum,
                weightUnit: prodWeightUnit,
                minStockThreshold: isNaN(minThresholdNum) ? 15 : minThresholdNum,
                categoryId: prodCategory
              }
            : item
        )
      );
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: prodName,
        sku: prodSku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        barcode: `890100${Math.floor(100 + Math.random() * 900)}`,
        categoryId: prodCategory,
        price: priceNum,
        stock: isNaN(stockNum) ? 0 : stockNum,
        weight: isNaN(weightNum) ? undefined : weightNum,
        weightUnit: prodWeightUnit,
        minStockThreshold: isNaN(minThresholdNum) ? 15 : minThresholdNum,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
      };
      setProducts(prev => [newProd, ...prev]);
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert('Hapus Produk', `Hapus produk "${name}" dari katalog?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          setProducts(prev => prev.filter(p => p.id !== id));
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.brandBadge} />
          <Text style={styles.brandTitle}>AfzPOS</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.printerBtn}
            onPress={() => setPrinterConnected(!printerConnected)}
          >
            <Ionicons
              name={printerConnected ? 'print' : 'print-outline'}
              size={16}
              color={printerConnected ? '#34d399' : '#94a3b8'}
            />
            <Text style={[styles.printerText, { color: printerConnected ? '#34d399' : '#94a3b8' }]}>
              {printerConnected ? 'BT Aktif' : 'BT Off'}
            </Text>
          </TouchableOpacity>

          {cart.length > 0 && (
            <TouchableOpacity style={styles.cartFloatingBtn} onPress={() => setShowCartModal(true)}>
              <Ionicons name="cart" size={18} color="#0f172a" />
              <View style={styles.cartBadgeCount}>
                <Text style={styles.cartBadgeText}>{cart.reduce((s, i) => s + i.quantity, 0)}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* KONTEN TAB */}
      <View style={styles.body}>
        {/* TAB 1: KASIR (REGISTER) */}
        {activeTab === 'register' && (
          <View style={styles.tabContent}>
            {/* Kolom Pencarian */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" size={16} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari produk atau SKU..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filter Kategori Horizontal */}
            <View style={styles.categoriesWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.categoryPill,
                      selectedCategory === cat.id && styles.categoryPillActive
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={selectedCategory === cat.id ? '#0f172a' : '#cbd5e1'}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        selectedCategory === cat.id && styles.categoryPillTextActive
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Grid Kartu Produk */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(item: Product) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              renderItem={({ item }: { item: Product }) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock > 0 && item.stock <= (item.minStockThreshold || 15);
                return (
                  <TouchableOpacity
                    style={[styles.productCard, isOutOfStock && styles.productCardDisabled]}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.8}
                    disabled={isOutOfStock}
                  >
                    <Image source={{ uri: item.image }} style={styles.productImage} />

                    {/* Badge Peringatan Stok Rendah */}
                    {isLowStock && (
                      <View style={styles.lowStockBadge}>
                        <Ionicons name="alert-circle" size={10} color="#fbbf24" />
                        <Text style={styles.lowStockText}>Sisa {item.stock}</Text>
                      </View>
                    )}
                    {isOutOfStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Habis</Text>
                      </View>
                    )}

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                      </Text>

                      {/* Satuan Berat / Isi */}
                      {item.weight && item.weightUnit && (
                        <View style={styles.weightBadge}>
                          <MaterialCommunityIcons name="scale" size={10} color="#38bdf8" />
                          <Text style={styles.weightText}>
                            {item.weight} {item.weightUnit}
                          </Text>
                        </View>
                      )}

                      <View style={styles.productPriceRow}>
                        <Text style={styles.productPrice}>{formatMoney(item.price, config.currencySymbol)}</Text>
                        <View style={styles.addIconCircle}>
                          <Ionicons name="add" size={16} color="#0f172a" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Bottom Bar Keranjang Aktif */}
            {cart.length > 0 && (
              <TouchableOpacity
                style={styles.cartBottomBar}
                activeOpacity={0.9}
                onPress={() => setShowCartModal(true)}
              >
                <View>
                  <Text style={styles.cartBottomItems}>
                    {cart.reduce((s, i) => s + i.quantity, 0)} Item • {customerName}
                  </Text>
                  <Text style={styles.cartBottomTotal}>{formatMoney(cartTotal, config.currencySymbol)}</Text>
                </View>
                <View style={styles.checkoutBtnPill}>
                  <Text style={styles.checkoutBtnText}>Lihat Pesanan</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0f172a" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 2: PESANAN (ORDERS) */}
        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
              <Text style={styles.sectionSubtitle}>{orders.length} Transaksi Selesai Hari Ini</Text>
            </View>

            {orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
                <Text style={styles.emptySubtitle}>Transaksi yang telah dibayar akan muncul di sini.</Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={(item: OrderRecord) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }: { item: OrderRecord }) => (
                  <TouchableOpacity
                    style={styles.orderCard}
                    onPress={() => setActiveReceipt(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.orderCardTop}>
                      <View>
                        <Text style={styles.orderNumberText}>Order #{item.orderNumber}</Text>
                        <Text style={styles.orderCustomerText}>{item.customerName} • {item.time}</Text>
                      </View>
                      <View style={styles.orderMethodPill}>
                        <Text style={styles.orderMethodText}>{item.paymentMethod.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.orderDivider} />
                    <View style={styles.orderCardBottom}>
                      <Text style={styles.orderItemsCount}>
                        {item.items.reduce((s: number, i: CartItem) => s + i.quantity, 0)} Items
                      </Text>
                      <Text style={styles.orderTotalAmount}>{formatMoney(item.total, config.currencySymbol)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 3: KATALOG PRODUK & STOK (CATALOG) */}
        {activeTab === 'catalog' && (
          <View style={styles.tabContent}>
            <View style={styles.catalogTopBar}>
              <View>
                <Text style={styles.sectionTitle}>Katalog & Stok</Text>
                <Text style={styles.sectionSubtitle}>{products.length} Total Produk</Text>
              </View>
              <TouchableOpacity style={styles.addProdBtn} onPress={handleOpenAddProduct}>
                <Ionicons name="add" size={16} color="#0f172a" />
                <Text style={styles.addProdBtnText}>Tambah</Text>
              </TouchableOpacity>
            </View>

            {/* Banner Peringatan Stok Rendah */}
            {lowStockCount > 0 && (
              <View style={styles.reorderBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reorderBannerTitle}>⚠️ {lowStockCount} Produk Perlu Reorder</Text>
                  <Text style={styles.reorderBannerDesc}>Stok berada di bawah batas minimum.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.filterReorderBtn, filterLowStockOnly && styles.filterReorderBtnActive]}
                  onPress={() => setFilterLowStockOnly(!filterLowStockOnly)}
                >
                  <Text style={[styles.filterReorderText, filterLowStockOnly && styles.filterReorderTextActive]}>
                    {filterLowStockOnly ? 'Semua' : 'Filter'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={filteredProducts}
              keyExtractor={(item: Product) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }: { item: Product }) => {
                const isLow = item.stock <= (item.minStockThreshold || 15);
                return (
                  <View style={[styles.inventoryCard, isLow && styles.inventoryCardLow]}>
                    <Image source={{ uri: item.image }} style={styles.inventoryThumb} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.inventoryName}>{item.name}</Text>
                      <Text style={styles.inventorySku}>{item.sku} • {formatMoney(item.price, config.currencySymbol)}</Text>
                      {item.weight && item.weightUnit && (
                        <Text style={styles.inventoryWeight}>Berat: {item.weight} {item.weightUnit}</Text>
                      )}
                      <Text style={[styles.inventoryStock, isLow ? { color: '#fbbf24' } : { color: '#94a3b8' }]}>
                        Stok: {item.stock} unit {isLow ? `(Min ${item.minStockThreshold})` : ''}
                      </Text>
                    </View>
                    <View style={styles.inventoryActions}>
                      <TouchableOpacity
                        style={styles.invEditBtn}
                        onPress={() => handleOpenEditProduct(item)}
                      >
                        <Feather name="edit-2" size={16} color="#38bdf8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.invDeleteBtn}
                        onPress={() => handleDeleteProduct(item.id, item.name)}
                      >
                        <Feather name="trash-2" size={16} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* TAB 4: LAPORAN & WHATSAPP (REPORTS) */}
        {activeTab === 'reports' && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Laporan Penjualan</Text>
              <Text style={styles.sectionSubtitle}>Ringkasan kinerja kasir hari ini</Text>
            </View>

            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL OMSET</Text>
                <Text style={styles.kpiValue}>
                  {formatMoney(orders.reduce((s, o) => s + o.total, 0), config.currencySymbol)}
                </Text>
                <Text style={styles.kpiSub}>Dari {orders.length} Transaksi</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>RATA-RATA</Text>
                <Text style={styles.kpiValue}>
                  {formatMoney(
                    orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0,
                    config.currencySymbol
                  )}
                </Text>
                <Text style={styles.kpiSub}>Per Pelanggan</Text>
              </View>
            </View>

            {/* Kartu Otomatisasi WhatsApp */}
            <View style={styles.whatsappCard}>
              <View style={styles.whatsappCardHeader}>
                <Ionicons name="logo-whatsapp" size={24} color="#22c55e" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.whatsappCardTitle}>Otomatisasi Laporan WhatsApp</Text>
                  <Text style={styles.whatsappCardDesc}>
                    Kirim laporan harian langsung ke {config.whatsappNumber} ({config.whatsappRecipientName})
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.whatsappSendBtn}
                onPress={() => sendWhatsAppReport()}
              >
                <Ionicons name="send" size={16} color="#ffffff" />
                <Text style={styles.whatsappSendText}>Kirim Laporan ke WhatsApp Sekarang</Text>
              </TouchableOpacity>
            </View>

            {/* Rincian Metode Pembayaran */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Metode Pembayaran</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownName}>Tunai (Cash)</Text>
                <Text style={styles.breakdownVal}>
                  {formatMoney(orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0), config.currencySymbol)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownName}>QRIS</Text>
                <Text style={styles.breakdownVal}>
                  {formatMoney(orders.filter(o => o.paymentMethod === 'qris').reduce((s, o) => s + o.total, 0), config.currencySymbol)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownName}>Kartu Debit/Kredit</Text>
                <Text style={styles.breakdownVal}>
                  {formatMoney(orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0), config.currencySymbol)}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* TAB 5: PENGATURAN (SETTINGS) */}
        {activeTab === 'settings' && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pengaturan Toko</Text>
              <Text style={styles.sectionSubtitle}>Konfigurasi AfzPOS & Laporan</Text>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={styles.settingsLabel}>Nama Toko</Text>
              <TextInput
                style={styles.settingsInput}
                value={config.storeName}
                onChangeText={(t: string) => setConfig({ ...config, storeName: t })}
              />

              <Text style={styles.settingsLabel}>Alamat Toko</Text>
              <TextInput
                style={styles.settingsInput}
                value={config.address}
                onChangeText={(t: string) => setConfig({ ...config, address: t })}
              />

              <Text style={styles.settingsLabel}>Nomor WhatsApp Laporan</Text>
              <TextInput
                style={styles.settingsInput}
                value={config.whatsappNumber}
                keyboardType="phone-pad"
                onChangeText={(t: string) => setConfig({ ...config, whatsappNumber: t })}
              />

              <Text style={styles.settingsLabel}>Nama Pemilik / Penerima</Text>
              <TextInput
                style={styles.settingsInput}
                value={config.whatsappRecipientName}
                onChangeText={(t: string) => setConfig({ ...config, whatsappRecipientName: t })}
              />

              <Text style={styles.settingsLabel}>Batas Default Stok Kritis (Threshold)</Text>
              <TextInput
                style={styles.settingsInput}
                value={config.lowStockDefaultThreshold.toString()}
                keyboardType="numeric"
                onChangeText={(t: string) => setConfig({ ...config, lowStockDefaultThreshold: parseInt(t, 10) || 15 })}
              />

              <TouchableOpacity
                style={styles.saveSettingsBtn}
                onPress={() => Alert.alert('Berhasil', 'Pengaturan berhasil disimpan.')}
              >
                <Text style={styles.saveSettingsText}>Simpan Pengaturan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM TAB NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('register')}
        >
          <Ionicons
            name={activeTab === 'register' ? 'apps' : 'apps-outline'}
            size={22}
            color={activeTab === 'register' ? '#fbbf24' : '#64748b'}
          />
          <Text style={[styles.navText, activeTab === 'register' && styles.navTextActive]}>Kasir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons
            name={activeTab === 'orders' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'orders' ? '#fbbf24' : '#64748b'}
          />
          <Text style={[styles.navText, activeTab === 'orders' && styles.navTextActive]}>Pesanan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('catalog')}
        >
          <Ionicons
            name={activeTab === 'catalog' ? 'cube' : 'cube-outline'}
            size={22}
            color={activeTab === 'catalog' ? '#fbbf24' : '#64748b'}
          />
          <Text style={[styles.navText, activeTab === 'catalog' && styles.navTextActive]}>Katalog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons
            name={activeTab === 'reports' ? 'bar-chart' : 'bar-chart-outline'}
            size={22}
            color={activeTab === 'reports' ? '#fbbf24' : '#64748b'}
          />
          <Text style={[styles.navText, activeTab === 'reports' && styles.navTextActive]}>Laporan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#fbbf24' : '#64748b'}
          />
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Pengaturan</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: KERANJANG BELANJA (CART) */}
      <Modal visible={showCartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pesanan Aktif ({cart.length})</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)}>
                <Ionicons name="close" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.customerInputRow}>
              <Text style={styles.customerLabel}>Meja / Nama:</Text>
              <TextInput
                style={styles.customerInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Contoh: Meja 04 / Budi"
                placeholderTextColor="#64748b"
              />
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
              {cart.map(item => (
                <View key={item.cartItemId} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    {item.weight && item.weightUnit && (
                      <Text style={styles.cartItemWeight}>{item.weight} {item.weightUnit}</Text>
                    )}
                    <Text style={styles.cartItemPrice}>
                      {formatMoney(item.price * item.quantity, config.currencySymbol)}
                    </Text>
                  </View>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(item.cartItemId, -1)}
                    >
                      <Ionicons name="remove" size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(item.cartItemId, 1)}
                    >
                      <Ionicons name="add" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.cartTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalVal}>{formatMoney(cartSubtotal, config.currencySymbol)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Pajak ({config.taxRate}%)</Text>
                <Text style={styles.totalVal}>{formatMoney(cartTax, config.currencySymbol)}</Text>
              </View>
              <View style={[styles.totalRow, { borderTopWidth: 1, borderColor: '#334155', paddingTop: 8 }]}>
                <Text style={styles.grandTotalLabel}>TOTAL BAYAR</Text>
                <Text style={styles.grandTotalVal}>{formatMoney(cartTotal, config.currencySymbol)}</Text>
              </View>
            </View>

            <View style={styles.cartModalActions}>
              <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
                <Text style={styles.clearCartText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.payBtn} onPress={handleOpenCheckout}>
                <Text style={styles.payBtnText}>Lanjut Bayar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PEMBAYARAN MULTI-METODE (PAYMENT) */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.payModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.payAmountBox}>
              <Text style={styles.payAmountLabel}>Total Tagihan</Text>
              <Text style={styles.payAmountValue}>{formatMoney(cartTotal, config.currencySymbol)}</Text>
            </View>

            <View style={styles.payMethodTabs}>
              <TouchableOpacity
                style={[styles.payMethodTab, paymentMethod === 'cash' && styles.payMethodTabActive]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Ionicons name="cash-outline" size={18} color={paymentMethod === 'cash' ? '#0f172a' : '#cbd5e1'} />
                <Text style={[styles.payMethodText, paymentMethod === 'cash' && styles.payMethodTextActive]}>Tunai</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodTab, paymentMethod === 'qris' && styles.payMethodTabActive]}
                onPress={() => setPaymentMethod('qris')}
              >
                <Ionicons name="qr-code-outline" size={18} color={paymentMethod === 'qris' ? '#0f172a' : '#cbd5e1'} />
                <Text style={[styles.payMethodText, paymentMethod === 'qris' && styles.payMethodTextActive]}>QRIS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodTab, paymentMethod === 'card' && styles.payMethodTabActive]}
                onPress={() => setPaymentMethod('card')}
              >
                <Ionicons name="card-outline" size={18} color={paymentMethod === 'card' ? '#0f172a' : '#cbd5e1'} />
                <Text style={[styles.payMethodText, paymentMethod === 'card' && styles.payMethodTextActive]}>Kartu</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'cash' && (
              <View style={styles.cashSection}>
                <Text style={styles.cashInputLabel}>Uang Diterima:</Text>
                <TextInput
                  style={styles.cashInput}
                  keyboardType="numeric"
                  value={cashTenderInput}
                  onChangeText={setCashTenderInput}
                />

                <View style={styles.quickCashRow}>
                  <TouchableOpacity
                    style={styles.quickCashPill}
                    onPress={() => setCashTenderInput(cartTotal.toString())}
                  >
                    <Text style={styles.quickCashText}>Uang Pas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickCashPill}
                    onPress={() => setCashTenderInput('50000')}
                  >
                    <Text style={styles.quickCashText}>50.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickCashPill}
                    onPress={() => setCashTenderInput('100000')}
                  >
                    <Text style={styles.quickCashText}>100.000</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>Kembalian:</Text>
                  <Text style={styles.changeVal}>
                    {formatMoney(Math.max(0, (parseFloat(cashTenderInput) || 0) - cartTotal), config.currencySymbol)}
                  </Text>
                </View>
              </View>
            )}

            {paymentMethod === 'qris' && (
              <View style={styles.qrisSection}>
                <Ionicons name="qr-code" size={140} color="#ffffff" />
                <Text style={styles.qrisHint}>Tunjukkan QRIS kepada pelanggan untuk di-scan</Text>
              </View>
            )}

            {paymentMethod === 'card' && (
              <View style={styles.qrisSection}>
                <Ionicons name="card" size={80} color="#38bdf8" />
                <Text style={styles.qrisHint}>Masukkan kartu pada EDC terminal AfzPOS</Text>
              </View>
            )}

            <TouchableOpacity style={styles.finishPayBtn} onPress={completePayment}>
              <Text style={styles.finishPayText}>Konfirmasi Pembayaran Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: STRUK DIGITAL (RECEIPT) */}
      <Modal visible={!!activeReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptPaper}>
              <Text style={styles.receiptTitle}>{config.storeName}</Text>
              <Text style={styles.receiptSub}>{config.address}</Text>
              <Text style={styles.receiptSub}>Tel: {config.phone}</Text>
              <Text style={styles.receiptDashed}>--------------------------------</Text>

              <Text style={styles.receiptSub}>Order #{activeReceipt?.orderNumber}</Text>
              <Text style={styles.receiptSub}>{activeReceipt?.date} {activeReceipt?.time}</Text>
              <Text style={styles.receiptSub}>Kasir: {activeReceipt?.cashierName}</Text>
              <Text style={styles.receiptSub}>Pelanggan: {activeReceipt?.customerName}</Text>
              <Text style={styles.receiptDashed}>--------------------------------</Text>

              {activeReceipt?.items.map(i => (
                <View key={i.cartItemId} style={styles.receiptItemLine}>
                  <Text style={styles.receiptItemName}>
                    {i.quantity}x {i.name} {i.weight && i.weightUnit ? `(${i.weight}${i.weightUnit})` : ''}
                  </Text>
                  <Text style={styles.receiptItemPrice}>
                    {formatMoney(i.price * i.quantity, config.currencySymbol)}
                  </Text>
                </View>
              ))}

              <Text style={styles.receiptDashed}>--------------------------------</Text>
              <View style={styles.receiptMathRow}>
                <Text style={styles.receiptMathLabel}>Subtotal:</Text>
                <Text style={styles.receiptMathVal}>{formatMoney(activeReceipt?.subtotal || 0, config.currencySymbol)}</Text>
              </View>
              <View style={styles.receiptMathRow}>
                <Text style={styles.receiptMathLabel}>Pajak ({config.taxRate}%):</Text>
                <Text style={styles.receiptMathVal}>{formatMoney(activeReceipt?.tax || 0, config.currencySymbol)}</Text>
              </View>
              <View style={[styles.receiptMathRow, { marginTop: 4 }]}>
                <Text style={styles.receiptTotalLabel}>TOTAL:</Text>
                <Text style={styles.receiptTotalVal}>{formatMoney(activeReceipt?.total || 0, config.currencySymbol)}</Text>
              </View>

              <Text style={styles.receiptDashed}>--------------------------------</Text>
              <Text style={styles.receiptSub}>Metode: {activeReceipt?.paymentMethod.toUpperCase()}</Text>
              {activeReceipt?.amountTendered !== undefined && (
                <>
                  <Text style={styles.receiptSub}>Tunai: {formatMoney(activeReceipt.amountTendered, config.currencySymbol)}</Text>
                  <Text style={styles.receiptSub}>Kembalian: {formatMoney(activeReceipt.changeGiven || 0, config.currencySymbol)}</Text>
                </>
              )}

              <Text style={styles.receiptFooter}>Terima Kasih Atas Kunjungan Anda!</Text>
            </View>

            <View style={styles.receiptBtnRow}>
              <TouchableOpacity
                style={styles.receiptActionBtn}
                onPress={() => {
                  Alert.alert('Cetak Struk', 'Struk berhasil dikirim ke printer bluetooth thermal.');
                }}
              >
                <Ionicons name="print" size={16} color="#0f172a" />
                <Text style={styles.receiptActionText}>Cetak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.receiptCloseBtn}
                onPress={() => setActiveReceipt(null)}
              >
                <Text style={styles.receiptCloseText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: TAMBAH / EDIT PRODUK KATALOG */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.prodModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.inputLabel}>Nama Produk</Text>
              <TextInput style={styles.formInput} value={prodName} onChangeText={setProdName} placeholder="Contoh: Cappuccino" placeholderTextColor="#64748b" />

              <Text style={styles.inputLabel}>SKU Produk</Text>
              <TextInput style={styles.formInput} value={prodSku} onChangeText={setProdSku} placeholder="SKU-101" placeholderTextColor="#64748b" />

              <Text style={styles.inputLabel}>Harga Jual (Rp)</Text>
              <TextInput style={styles.formInput} value={prodPrice} onChangeText={setProdPrice} keyboardType="numeric" placeholder="25000" placeholderTextColor="#64748b" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stok Awal</Text>
                  <TextInput style={styles.formInput} value={prodStock} onChangeText={setProdStock} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Batas Kritis</Text>
                  <TextInput style={styles.formInput} value={prodMinThreshold} onChangeText={setProdMinThreshold} keyboardType="numeric" />
                </View>
              </View>

              {/* Satuan Berat & Unit */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Berat / Isi</Text>
                  <TextInput style={styles.formInput} value={prodWeight} onChangeText={setProdWeight} keyboardType="numeric" placeholder="Contoh: 250" placeholderTextColor="#64748b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Satuan (Unit)</Text>
                  <View style={styles.unitSelector}>
                    {(['g', 'kg', 'ml', 'pcs'] as WeightUnit[]).map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitPill, prodWeightUnit === u && styles.unitPillActive]}
                        onPress={() => setProdWeightUnit(u)}
                      >
                        <Text style={[styles.unitText, prodWeightUnit === u && styles.unitTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveProdBtn} onPress={handleSaveProduct}>
                <Text style={styles.saveProdText}>Simpan ke Katalog</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// 4. STYLESHEET (DARK MODE LUXE THEME)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandBadge: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#fbbf24'
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  printerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4
  },
  printerText: {
    fontSize: 11,
    fontWeight: '600'
  },
  cartFloatingBtn: {
    backgroundColor: '#fbbf24',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  cartBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    paddingHorizontal: 4,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  body: {
    flex: 1
  },
  tabContent: {
    flex: 1
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    marginLeft: 8
  },
  categoriesWrapper: {
    marginBottom: 8
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6
  },
  categoryPillActive: {
    backgroundColor: '#fbbf24'
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8'
  },
  categoryPillTextActive: {
    color: '#0f172a',
    fontWeight: '800'
  },
  productList: {
    paddingHorizontal: 10,
    paddingBottom: 90
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 12
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  productCardDisabled: {
    opacity: 0.5
  },
  productImage: {
    width: '100%',
    height: 105,
    backgroundColor: '#1e293b'
  },
  lowStockBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a'
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  outOfStockText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff'
  },
  productInfo: {
    padding: 10
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
    marginBottom: 6
  },
  weightText: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: '600'
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24'
  },
  addIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cartBottomBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  cartBottomItems: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600'
  },
  cartBottomTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24'
  },
  checkoutBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    paddingBottom: 14
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b'
  },
  navTextActive: {
    color: '#fbbf24',
    fontWeight: '800'
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  },
  orderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  orderCustomerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  orderMethodPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  orderMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8'
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 10
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderItemsCount: {
    fontSize: 12,
    color: '#64748b'
  },
  orderTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fbbf24'
  },
  catalogTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  addProdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  addProdBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  reorderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    margin: 16,
    padding: 12,
    borderRadius: 10
  },
  reorderBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24'
  },
  reorderBannerDesc: {
    fontSize: 11,
    color: '#fef3c7',
    marginTop: 2
  },
  filterReorderBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  filterReorderBtnActive: {
    backgroundColor: '#fbbf24'
  },
  filterReorderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24'
  },
  filterReorderTextActive: {
    color: '#0f172a'
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  inventoryCardLow: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)'
  },
  inventoryThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#1e293b'
  },
  inventoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  inventorySku: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  inventoryWeight: {
    fontSize: 11,
    color: '#38bdf8',
    marginTop: 1
  },
  inventoryStock: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  inventoryActions: {
    flexDirection: 'row',
    gap: 8
  },
  invEditBtn: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8
  },
  invDeleteBtn: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24',
    marginVertical: 4
  },
  kpiSub: {
    fontSize: 11,
    color: '#94a3b8'
  },
  whatsappCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16
  },
  whatsappCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  whatsappCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  whatsappCardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  whatsappSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8
  },
  whatsappSendText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff'
  },
  breakdownCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  breakdownName: {
    fontSize: 12,
    color: '#94a3b8'
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  settingsGroup: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  settingsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 12,
    marginBottom: 6
  },
  settingsInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    color: '#ffffff',
    fontSize: 13
  },
  saveSettingsBtn: {
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  saveSettingsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end'
  },
  cartModalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  customerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b'
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginRight: 8
  },
  customerInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    padding: 4
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  cartItemWeight: {
    fontSize: 11,
    color: '#38bdf8',
    marginTop: 2
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: 2
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 4,
    gap: 8
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 16,
    textAlign: 'center'
  },
  cartTotals: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  totalLabel: {
    fontSize: 12,
    color: '#94a3b8'
  },
  totalVal: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600'
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24'
  },
  cartModalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  clearCartBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8'
  },
  payBtn: {
    flex: 2,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  payModalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24
  },
  payAmountBox: {
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  payAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  payAmountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: 4
  },
  payMethodTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  payMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  payMethodTabActive: {
    backgroundColor: '#fbbf24'
  },
  payMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  payMethodTextActive: {
    color: '#0f172a'
  },
  cashSection: {
    paddingHorizontal: 16
  },
  cashInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6
  },
  cashInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  quickCashRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  quickCashPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  quickCashText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22c55e'
  },
  changeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22c55e'
  },
  qrisSection: {
    alignItems: 'center',
    padding: 24,
    gap: 12
  },
  qrisHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center'
  },
  finishPayBtn: {
    backgroundColor: '#22c55e',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  finishPayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  receiptContainer: {
    backgroundColor: '#0f172a',
    margin: 20,
    borderRadius: 16,
    padding: 16,
    alignSelf: 'center',
    width: width - 40,
    maxHeight: '85%'
  },
  receiptPaper: {
    backgroundColor: '#fbfbf8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center'
  },
  receiptSub: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center'
  },
  receiptDashed: {
    color: '#94a3b8',
    fontSize: 10,
    marginVertical: 4
  },
  receiptItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 2
  },
  receiptItemName: {
    fontSize: 10,
    color: '#1e293b',
    flex: 1
  },
  receiptItemPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b'
  },
  receiptMathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  receiptMathLabel: {
    fontSize: 10,
    color: '#475569'
  },
  receiptMathVal: {
    fontSize: 10,
    color: '#1e293b'
  },
  receiptTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a'
  },
  receiptTotalVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a'
  },
  receiptFooter: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center'
  },
  receiptBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  receiptActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  receiptCloseBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  receiptCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff'
  },
  prodModalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 10,
    marginBottom: 4
  },
  formInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#ffffff',
    fontSize: 13
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4
  },
  unitPill: {
    flex: 1,
    backgroundColor: '#1e293b',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unitPillActive: {
    backgroundColor: '#fbbf24'
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8'
  },
  unitTextActive: {
    color: '#0f172a'
  },
  saveProdBtn: {
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  saveProdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  }
});