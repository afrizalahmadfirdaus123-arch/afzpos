import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Product,
  CartItem,
  Discount,
  DiningOption,
  Order,
  DrawerSession,
  CashMovement,
  StoreConfig,
  SelectedModifier,
  PaymentDetails,
  SalesReport,
  SalesReportPeriod,
  ProductSalesStat,
  Language
} from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_STORE_CONFIG } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { playSound } from '../utils/sound';

interface POSContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  setCurrencyPreset: (preset: 'IDR' | 'USD') => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, newStock: number) => void;

  // Cart & Order Building
  cart: CartItem[];
  addToCart: (product: Product, modifiers?: SelectedModifier[], note?: string, quantity?: number) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  updateItemNote: (cartItemId: string, note: string) => void;
  addCustomItem: (name: string, price: number, hasTax: boolean) => void;

  // Order Details
  diningOption: DiningOption;
  setDiningOption: (opt: DiningOption) => void;
  tableOrCustomer: string;
  setTableOrCustomer: (val: string) => void;
  activeDiscount: Discount | null;
  applyDiscount: (discount: Discount | null) => void;
  tipAmount: number;
  setTipAmount: (amount: number) => void;

  // Calculations
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;

  // Checkout & Orders
  completeCurrentOrder: (payment: PaymentDetails) => Order;
  ordersHistory: Order[];
  parkedOrders: Order[];
  parkCurrentOrder: () => void;
  resumeParkedOrder: (orderId: string) => void;
  deleteParkedOrder: (orderId: string) => void;
  refundOrder: (orderId: string, reason: string) => void;

  // Sales Reporting
  generateSalesReport: (period: SalesReportPeriod) => SalesReport;

  // Cash Drawer & Shift
  currentShift: DrawerSession;
  shiftHistory: DrawerSession[];
  openShift: (startingFloat: number, cashierName?: string) => void;
  recordCashMovement: (type: 'cash_in' | 'cash_out', amount: number, reason: string) => void;
  closeShift: (countedCash: number, note?: string) => DrawerSession;

  // Store Configuration
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => void;
  resetAllData: () => void;

  // Barcode / Scanner
  scanBarcode: (barcodeOrSku: string) => boolean;

  // Active view management
  activeTab: 'register' | 'orders' | 'reports' | 'drawer' | 'inventory' | 'settings';
  setActiveTab: (tab: 'register' | 'orders' | 'reports' | 'drawer' | 'inventory' | 'settings') => void;

  // Completed Receipt Dialog
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;

  // Search filter query
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'apex_pos_products_v2',
  CONFIG: 'apex_pos_config_v2',
  ORDERS: 'apex_pos_orders_v2',
  PARKED: 'apex_pos_parked_v2',
  CURRENT_SHIFT: 'apex_pos_current_shift_v2',
  SHIFT_HISTORY: 'apex_pos_shift_history_v2',
  ORDER_COUNTER: 'apex_pos_order_counter_v2',
  LANGUAGE: 'apex_pos_language_v2'
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'register' | 'orders' | 'reports' | 'drawer' | 'inventory' | 'settings'>('register');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load language preference (default 'id' Indonesian)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (saved === 'en' || saved === 'id') return saved;
    } catch {
      // fallback
    }
    return 'id'; // Default Indonesian as requested!
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  // Translation lookup helper
  const t = useCallback((key: keyof typeof TRANSLATIONS['en']): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }, [language]);

  // Load or Initialize Store Config
  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default to Rupiah store configuration
    return {
      storeName: 'AFZPOS KAFE & BISTRO',
      taxRate: 11, // Standard PPN 11% in Indonesia
      currencySymbol: 'Rp',
      currencyCode: 'IDR',
      language: 'id',
      addressLine1: 'Jl. Senopati No. 42',
      addressLine2: 'Jakarta Selatan 12190',
      phone: '(021) 555-0199',
      receiptHeaderMsg: 'Kopi Panggang Segar & Makanan Buatan Tangan',
      receiptFooterMsg: 'Terima kasih atas kunjungan Anda! Ikuti kami @afzpos',
      soundEnabled: true,
      defaultCashier: 'Budi Santoso (Kasir Utama)',
      enableBarcodeScanner: true,
      whatsappNumber: '+6281234567890',
      whatsappRecipientName: 'Owner AfzPOS',
      autoSendWhatsAppDaily: true,
      whatsappDailyTime: '21:00',
      lowStockDefaultThreshold: 15
    };
  });

  // Load or Initialize Products (adapt default prices if currency is IDR)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default starting products formatted in Rupiah
    return INITIAL_PRODUCTS.map(p => ({
      ...p,
      price: Math.round(p.price * 5000), // e.g. 5.25 -> 26.000 or rounded
      costPrice: p.costPrice ? Math.round(p.costPrice * 5000) : undefined,
      modifiers: p.modifiers?.map(group => ({
        ...group,
        options: group.options.map(opt => ({
          ...opt,
          priceDelta: opt.priceDelta ? Math.round(opt.priceDelta * 5000) : 0
        }))
      }))
    }));
  });

  // Currency preset toggle (IDR vs USD)
  const setCurrencyPreset = useCallback((preset: 'IDR' | 'USD') => {
    if (preset === 'IDR') {
      setConfig(prev => ({
        ...prev,
        currencySymbol: 'Rp',
        currencyCode: 'IDR',
        taxRate: 11
      }));
      setProducts(prev =>
        prev.map(p => ({
          ...p,
          price: p.price < 500 ? Math.round(p.price * 5000) : p.price
        }))
      );
    } else {
      setConfig(prev => ({
        ...prev,
        currencySymbol: '$',
        currencyCode: 'USD',
        taxRate: 8.25
      }));
      setProducts(prev =>
        prev.map(p => ({
          ...p,
          price: p.price >= 500 ? Number((p.price / 5000).toFixed(2)) : p.price
        }))
      );
    }
  }, []);

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [diningOption, setDiningOption] = useState<DiningOption>('dine_in');
  const [tableOrCustomer, setTableOrCustomer] = useState<string>('');
  const [activeDiscount, setActiveDiscount] = useState<Discount | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(0);

  // Orders History
  const [ordersHistory, setOrdersHistory] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Seed 3 realistic starter completed orders for today so Reports & History have immediate live data!
    const now = Date.now();
    return [
      {
        id: 'ord_sample_1',
        orderNumber: 1040,
        formattedOrderNumber: '#1040',
        createdAt: now - 3600000 * 2.5,
        items: [
          {
            cartItemId: 'item_s1',
            productId: 'prod_latte',
            name: 'Artisan Latte',
            sku: 'COF-101',
            unitPrice: 28000,
            quantity: 2,
            selectedModifiers: [],
            finalPrice: 28000,
            hasTax: true
          },
          {
            cartItemId: 'item_s2',
            productId: 'prod_croissant',
            name: 'Flaky Butter Croissant',
            sku: 'BAK-201',
            unitPrice: 22000,
            quantity: 1,
            selectedModifiers: [],
            finalPrice: 22000,
            hasTax: true
          }
        ],
        subtotal: 78000,
        discountAmount: 0,
        taxRate: 11,
        taxAmount: 8580,
        tipAmount: 5000,
        total: 91580,
        diningOption: 'dine_in',
        tableOrCustomer: 'Meja 02',
        cashierName: 'Budi Santoso',
        paymentDetails: {
          method: 'cash',
          amountTendered: 100000,
          changeGiven: 8420
        },
        status: 'completed'
      },
      {
        id: 'ord_sample_2',
        orderNumber: 1041,
        formattedOrderNumber: '#1041',
        createdAt: now - 3600000 * 1.2,
        items: [
          {
            cartItemId: 'item_s3',
            productId: 'prod_avocado_toast',
            name: 'Heirloom Avocado Toast',
            sku: 'BIS-301',
            unitPrice: 62000,
            quantity: 1,
            selectedModifiers: [],
            finalPrice: 62000,
            hasTax: true
          },
          {
            cartItemId: 'item_s4',
            productId: 'prod_cold_brew',
            name: 'Nitro Cold Brew',
            sku: 'COF-102',
            unitPrice: 29000,
            quantity: 1,
            selectedModifiers: [],
            finalPrice: 29000,
            hasTax: true
          }
        ],
        subtotal: 91000,
        discountAmount: 9100,
        taxRate: 11,
        taxAmount: 9009,
        tipAmount: 0,
        total: 90909,
        diningOption: 'takeaway',
        tableOrCustomer: 'Sarah W.',
        cashierName: 'Budi Santoso',
        paymentDetails: {
          method: 'card',
          cardBrand: 'BCA Debit',
          cardLast4: '5512',
          approvalCode: 'AUTH_819201'
        },
        status: 'completed'
      },
      {
        id: 'ord_sample_3',
        orderNumber: 1042,
        formattedOrderNumber: '#1042',
        createdAt: now - 3600000 * 0.4,
        items: [
          {
            cartItemId: 'item_s5',
            productId: 'prod_latte',
            name: 'Artisan Latte',
            sku: 'COF-101',
            unitPrice: 28000,
            quantity: 1,
            selectedModifiers: [],
            finalPrice: 28000,
            hasTax: true
          }
        ],
        subtotal: 28000,
        discountAmount: 0,
        taxRate: 11,
        taxAmount: 3080,
        tipAmount: 0,
        total: 31080,
        diningOption: 'dine_in',
        tableOrCustomer: 'Counter Guest',
        cashierName: 'Budi Santoso',
        paymentDetails: {
          method: 'qr',
          qrProvider: 'QRIS BCA / GoPay',
          approvalCode: 'QRIS_84920'
        },
        status: 'completed'
      }
    ];
  });

  // Parked (Held) Orders
  const [parkedOrders, setParkedOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARKED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Shift & Cash Drawer
  const [currentShift, setCurrentShift] = useState<DrawerSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      id: 'shift_' + Date.now(),
      openedAt: Date.now() - 3600000 * 4,
      cashierName: 'Budi Santoso',
      startingFloat: 500000, // Rp 500.000 starting cash
      cashSales: 91580,
      cardSales: 90909,
      qrSales: 31080,
      movements: []
    };
  });

  const [shiftHistory, setShiftHistory] = useState<DrawerSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderCounter, setOrderCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDER_COUNTER);
      return saved ? parseInt(saved, 10) : 1043;
    } catch {
      return 1043;
    }
  });

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersHistory));
  }, [ordersHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARKED, JSON.stringify(parkedOrders));
  }, [parkedOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT_HISTORY, JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, orderCounter.toString());
  }, [orderCounter]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.finalPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!activeDiscount || subtotal <= 0) return 0;
    if (activeDiscount.type === 'percentage') {
      return Math.round((subtotal * activeDiscount.value) / 100);
    }
    return Math.min(subtotal, activeDiscount.value);
  }, [subtotal, activeDiscount]);

  const taxableAmount = useMemo(() => {
    const postDiscountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
    const taxableItemsTotal = cart
      .filter(item => item.hasTax)
      .reduce((acc, item) => acc + item.finalPrice * item.quantity, 0);
    return Math.max(0, taxableItemsTotal * postDiscountRatio);
  }, [cart, subtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    if (config.taxRate <= 0) return 0;
    return Math.round((taxableAmount * config.taxRate) / 100);
  }, [taxableAmount, config.taxRate]);

  const total = useMemo(() => {
    const calculated = subtotal - discountAmount + taxAmount + tipAmount;
    return Math.max(0, calculated);
  }, [subtotal, discountAmount, taxAmount, tipAmount]);

  // Cart operations
  const addToCart = useCallback((
    product: Product,
    selectedModifiers: SelectedModifier[] = [],
    note: string = '',
    quantity: number = 1
  ) => {
    playSound.beep(config.soundEnabled);

    setCart(prev => {
      const modSig = selectedModifiers
        .map(m => m.modifierId)
        .sort()
        .join('|');

      const existingIndex = prev.findIndex(
        item =>
          item.productId === product.id &&
          item.itemNote === (note || '') &&
          item.selectedModifiers
            .map(m => m.modifierId)
            .sort()
            .join('|') === modSig
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }

      const modSum = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
      const finalPrice = product.price + modSum;

      const newItem: CartItem = {
        cartItemId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.price,
        quantity,
        weight: product.weight,
        weightUnit: product.weightUnit,
        selectedModifiers,
        itemNote: note,
        finalPrice,
        hasTax: product.hasTax
      };

      return [...prev, newItem];
    });
  }, [config.soundEnabled]);

  const updateQuantity = useCallback((cartItemId: string, newQty: number) => {
    playSound.click(config.soundEnabled);
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item
        )
      );
    }
  }, [config.soundEnabled]);

  const removeItem = useCallback((cartItemId: string) => {
    playSound.click(config.soundEnabled);
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, [config.soundEnabled]);

  const clearCart = useCallback(() => {
    playSound.click(config.soundEnabled);
    setCart([]);
    setActiveDiscount(null);
    setTipAmount(0);
    setTableOrCustomer('');
  }, [config.soundEnabled]);

  const updateItemNote = useCallback((cartItemId: string, note: string) => {
    setCart(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId ? { ...item, itemNote: note } : item
      )
    );
  }, []);

  const addCustomItem = useCallback((name: string, price: number, hasTax: boolean) => {
    playSound.beep(config.soundEnabled);
    const customItem: CartItem = {
      cartItemId: `custom_${Date.now()}`,
      productId: 'custom_open_ring',
      name: name || (language === 'id' ? 'Item Khusus' : 'Custom Item'),
      sku: 'MISC-00',
      unitPrice: price,
      quantity: 1,
      selectedModifiers: [],
      finalPrice: price,
      hasTax
    };
    setCart(prev => [...prev, customItem]);
  }, [config.soundEnabled, language]);

  const applyDiscount = useCallback((discount: Discount | null) => {
    playSound.click(config.soundEnabled);
    setActiveDiscount(discount);
  }, [config.soundEnabled]);

  // Complete Order
  const completeCurrentOrder = useCallback((payment: PaymentDetails): Order => {
    if (cart.length === 0) {
      throw new Error('Cannot complete empty cart');
    }

    const nextOrderNum = orderCounter;
    setOrderCounter(prev => prev + 1);

    const defaultCustomerName = diningOption === 'dine_in'
      ? (language === 'id' ? 'Pelanggan Meja' : 'Table Walk-in')
      : (language === 'id' ? 'Pelanggan Kasir' : 'Counter Guest');

    const order: Order = {
      id: `ord_${Date.now()}_${nextOrderNum}`,
      orderNumber: nextOrderNum,
      formattedOrderNumber: `#${nextOrderNum}`,
      createdAt: Date.now(),
      items: [...cart],
      subtotal,
      discountAmount,
      discountApplied: activeDiscount || undefined,
      taxRate: config.taxRate,
      taxAmount,
      tipAmount,
      total,
      diningOption,
      tableOrCustomer: tableOrCustomer.trim() || defaultCustomerName,
      cashierName: config.defaultCashier,
      paymentDetails: payment,
      status: 'completed'
    };

    // Deduct stock for inventory products
    setProducts(prev => {
      return prev.map(prod => {
        const cartMatches = cart.filter(ci => ci.productId === prod.id);
        if (cartMatches.length > 0) {
          const totalQty = cartMatches.reduce((acc, ci) => acc + ci.quantity, 0);
          return {
            ...prod,
            stock: Math.max(0, prod.stock - totalQty)
          };
        }
        return prod;
      });
    });

    // Update Shift Totals
    setCurrentShift(prev => {
      let cashDelta = 0;
      let cardDelta = 0;
      let qrDelta = 0;

      if (payment.method === 'cash') {
        cashDelta = total;
      } else if (payment.method === 'card') {
        cardDelta = total;
      } else if (payment.method === 'qr') {
        qrDelta = total;
      } else if (payment.method === 'split' && payment.splitBreakdown) {
        payment.splitBreakdown.forEach(s => {
          if (s.method === 'cash') cashDelta += s.amount;
          if (s.method === 'card') cardDelta += s.amount;
          if (s.method === 'qr') qrDelta += s.amount;
        });
      }

      return {
        ...prev,
        cashSales: Number((prev.cashSales + cashDelta).toFixed(2)),
        cardSales: Number((prev.cardSales + cardDelta).toFixed(2)),
        qrSales: Number((prev.qrSales + qrDelta).toFixed(2))
      };
    });

    // Sound cues
    if (payment.method === 'cash') {
      playSound.drawer(config.soundEnabled);
    } else {
      playSound.success(config.soundEnabled);
    }

    // Prepend to orders history
    setOrdersHistory(prev => [order, ...prev]);

    // Reset cart
    setCart([]);
    setActiveDiscount(null);
    setTipAmount(0);
    setTableOrCustomer('');

    // Set as active receipt
    setActiveReceiptOrder(order);

    return order;
  }, [
    cart,
    orderCounter,
    subtotal,
    discountAmount,
    activeDiscount,
    config.taxRate,
    config.defaultCashier,
    config.soundEnabled,
    taxAmount,
    tipAmount,
    total,
    diningOption,
    tableOrCustomer,
    language
  ]);

  // Park (Hold) Current Order
  const parkCurrentOrder = useCallback(() => {
    if (cart.length === 0) return;
    playSound.beep(config.soundEnabled);

    const nextOrderNum = orderCounter;
    setOrderCounter(prev => prev + 1);

    const heldOrder: Order = {
      id: `parked_${Date.now()}_${nextOrderNum}`,
      orderNumber: nextOrderNum,
      formattedOrderNumber: `HOLD #${nextOrderNum}`,
      createdAt: Date.now(),
      items: [...cart],
      subtotal,
      discountAmount,
      discountApplied: activeDiscount || undefined,
      taxRate: config.taxRate,
      taxAmount,
      tipAmount,
      total,
      diningOption,
      tableOrCustomer: tableOrCustomer.trim() || (language === 'id' ? 'Antrean Belum Bernama' : 'Unassigned Tab'),
      cashierName: config.defaultCashier,
      paymentDetails: { method: 'cash' },
      status: 'parked'
    };

    setParkedOrders(prev => [heldOrder, ...prev]);
    setCart([]);
    setActiveDiscount(null);
    setTipAmount(0);
    setTableOrCustomer('');
  }, [
    cart,
    orderCounter,
    subtotal,
    discountAmount,
    activeDiscount,
    config.taxRate,
    config.defaultCashier,
    config.soundEnabled,
    taxAmount,
    tipAmount,
    total,
    diningOption,
    tableOrCustomer,
    language
  ]);

  const resumeParkedOrder = useCallback((orderId: string) => {
    const target = parkedOrders.find(o => o.id === orderId);
    if (!target) return;
    playSound.click(config.soundEnabled);

    setCart(target.items);
    setDiningOption(target.diningOption);
    setTableOrCustomer(target.tableOrCustomer);
    setActiveDiscount(target.discountApplied || null);
    setTipAmount(target.tipAmount || 0);

    setParkedOrders(prev => prev.filter(o => o.id !== orderId));
    setActiveTab('register');
  }, [parkedOrders, config.soundEnabled]);

  const deleteParkedOrder = useCallback((orderId: string) => {
    playSound.click(config.soundEnabled);
    setParkedOrders(prev => prev.filter(o => o.id !== orderId));
  }, [config.soundEnabled]);

  const refundOrder = useCallback((orderId: string, reason: string) => {
    playSound.error(config.soundEnabled);
    setOrdersHistory(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;

        // Restore stock
        setProducts(prodList => {
          return prodList.map(prod => {
            const matches = order.items.filter(item => item.productId === prod.id);
            if (matches.length > 0) {
              const qty = matches.reduce((acc, m) => acc + m.quantity, 0);
              return { ...prod, stock: prod.stock + qty };
            }
            return prod;
          });
        });

        return {
          ...order,
          status: 'refunded',
          refundDetails: {
            refundedAt: Date.now(),
            reason,
            refundedBy: config.defaultCashier
          }
        };
      })
    );
  }, [config.defaultCashier, config.soundEnabled]);

  // Sales Reporting Engine
  const generateSalesReport = useCallback((period: SalesReportPeriod): SalesReport => {
    const now = new Date();
    let startDate = 0;
    const endDate = now.getTime();

    if (period === 'daily') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      startDate = startOfDay.getTime();
    } else if (period === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = sevenDaysAgo.getTime();
    } else if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      startDate = startOfMonth.getTime();
    } else {
      // all time
      startDate = 0;
    }

    // Filter valid completed non-refunded orders within date range
    const validOrders = ordersHistory.filter(
      order => order.createdAt >= startDate && order.createdAt <= endDate && order.status === 'completed'
    );

    let totalGrossSales = 0;
    let totalNetSales = 0;
    let totalTax = 0;
    let totalTips = 0;
    let totalDiscounts = 0;
    const paymentMethodTotals = { cash: 0, card: 0, qr: 0 };
    const productAggregation: Record<string, { productId: string; name: string; sku: string; category: string; quantitySold: number; grossRevenue: number }> = {};

    validOrders.forEach(order => {
      totalGrossSales += order.total;
      totalNetSales += (order.subtotal - order.discountAmount);
      totalTax += order.taxAmount;
      totalTips += order.tipAmount;
      totalDiscounts += order.discountAmount;

      // Tender breakdown
      if (order.paymentDetails.method === 'cash') {
        paymentMethodTotals.cash += order.total;
      } else if (order.paymentDetails.method === 'card') {
        paymentMethodTotals.card += order.total;
      } else if (order.paymentDetails.method === 'qr') {
        paymentMethodTotals.qr += order.total;
      } else if (order.paymentDetails.method === 'split' && order.paymentDetails.splitBreakdown) {
        order.paymentDetails.splitBreakdown.forEach(s => {
          if (s.method === 'cash') paymentMethodTotals.cash += s.amount;
          if (s.method === 'card') paymentMethodTotals.card += s.amount;
          if (s.method === 'qr') paymentMethodTotals.qr += s.amount;
        });
      }

      // Products breakdown
      order.items.forEach(item => {
        const itemRev = item.finalPrice * item.quantity;
        if (!productAggregation[item.productId]) {
          productAggregation[item.productId] = {
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            category: 'Menu',
            quantitySold: 0,
            grossRevenue: 0
          };
        }
        productAggregation[item.productId].quantitySold += item.quantity;
        productAggregation[item.productId].grossRevenue += itemRev;
      });
    });

    const productStats: ProductSalesStat[] = Object.values(productAggregation)
      .map(p => ({
        ...p,
        sharePercentage: totalGrossSales > 0 ? Number(((p.grossRevenue / totalGrossSales) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.grossRevenue - a.grossRevenue);

    const transactionCount = validOrders.length;
    const averageTransactionValue = transactionCount > 0 ? Number((totalGrossSales / transactionCount).toFixed(2)) : 0;

    return {
      period,
      startDate,
      endDate,
      totalGrossSales,
      totalNetSales,
      totalTax,
      totalTips,
      totalDiscounts,
      transactionCount,
      averageTransactionValue,
      paymentMethodTotals,
      productStats
    };
  }, [ordersHistory]);

  // Cash Drawer Management
  const openShift = useCallback((startingFloat: number, cashierName?: string) => {
    playSound.drawer(config.soundEnabled);
    const newShift: DrawerSession = {
      id: 'shift_' + Date.now(),
      openedAt: Date.now(),
      cashierName: cashierName || config.defaultCashier,
      startingFloat,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      movements: []
    };
    setCurrentShift(newShift);
  }, [config.defaultCashier, config.soundEnabled]);

  const recordCashMovement = useCallback((type: 'cash_in' | 'cash_out', amount: number, reason: string) => {
    playSound.drawer(config.soundEnabled);
    const movement: CashMovement = {
      id: 'mv_' + Date.now(),
      type,
      amount,
      reason,
      cashierName: config.defaultCashier,
      timestamp: Date.now()
    };

    setCurrentShift(prev => ({
      ...prev,
      movements: [movement, ...prev.movements]
    }));
  }, [config.defaultCashier, config.soundEnabled]);

  const closeShift = useCallback((countedCash: number, note?: string): DrawerSession => {
    playSound.drawer(config.soundEnabled);

    const cashInTotal = currentShift.movements
      .filter(m => m.type === 'cash_in')
      .reduce((acc, m) => acc + m.amount, 0);
    const cashOutTotal = currentShift.movements
      .filter(m => m.type === 'cash_out')
      .reduce((acc, m) => acc + m.amount, 0);

    const expectedCash = currentShift.startingFloat + currentShift.cashSales + cashInTotal - cashOutTotal;
    const variance = countedCash - expectedCash;

    const closedSession: DrawerSession = {
      ...currentShift,
      closedAt: Date.now(),
      countedCashAtClose: countedCash,
      expectedCashAtClose: expectedCash,
      variance,
      note
    };

    setShiftHistory(prev => [closedSession, ...prev]);

    const nextSession: DrawerSession = {
      id: 'shift_' + Date.now(),
      openedAt: Date.now(),
      cashierName: config.defaultCashier,
      startingFloat: countedCash,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      movements: []
    };
    setCurrentShift(nextSession);

    return closedSession;
  }, [currentShift, config.defaultCashier, config.soundEnabled]);

  // Barcode Scanning
  const scanBarcode = useCallback((barcodeOrSku: string): boolean => {
    const clean = barcodeOrSku.trim().toLowerCase();
    const match = products.find(
      p => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
    );
    if (match && match.available && match.stock > 0) {
      addToCart(match);
      return true;
    }
    playSound.error(config.soundEnabled);
    return false;
  }, [products, addToCart, config.soundEnabled]);

  // Product management (Add, View, Edit, Delete)
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    playSound.click(config.soundEnabled);
    const newProduct: Product = {
      ...productData,
      id: 'prod_' + Date.now()
    };
    setProducts(prev => [newProduct, ...prev]);
  }, [config.soundEnabled]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    playSound.click(config.soundEnabled);
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, [config.soundEnabled]);

  const deleteProduct = useCallback((id: string) => {
    playSound.click(config.soundEnabled);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [config.soundEnabled]);

  const adjustStock = useCallback((id: string, newStock: number) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p)));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<StoreConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS.map(p => ({ ...p, price: Math.round(p.price * 5000) })));
    setConfig({
      storeName: 'APEX KAFE & BISTRO',
      taxRate: 11,
      currencySymbol: 'Rp',
      currencyCode: 'IDR',
      language: 'id',
      addressLine1: 'Jl. Senopati No. 42',
      addressLine2: 'Jakarta Selatan 12190',
      phone: '(021) 555-0199',
      receiptHeaderMsg: 'Kopi Panggang Segar & Makanan Buatan Tangan',
      receiptFooterMsg: 'Terima kasih atas kunjungan Anda! Ikuti kami @apexkafe',
      soundEnabled: true,
      defaultCashier: 'Budi Santoso',
      enableBarcodeScanner: true
    });
    setLanguageState('id');
    setCart([]);
    setOrdersHistory([]);
    setParkedOrders([]);
    setOrderCounter(1043);
    setCurrentShift({
      id: 'shift_' + Date.now(),
      openedAt: Date.now(),
      cashierName: 'Budi Santoso',
      startingFloat: 500000,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      movements: []
    });
    setShiftHistory([]);
  }, []);

  return (
    <POSContext.Provider
      value={{
        language,
        setLanguage,
        t,
        setCurrencyPreset,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        cart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        updateItemNote,
        addCustomItem,
        diningOption,
        setDiningOption,
        tableOrCustomer,
        setTableOrCustomer,
        activeDiscount,
        applyDiscount,
        tipAmount,
        setTipAmount,
        subtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        total,
        completeCurrentOrder,
        ordersHistory,
        parkedOrders,
        parkCurrentOrder,
        resumeParkedOrder,
        deleteParkedOrder,
        refundOrder,
        generateSalesReport,
        currentShift,
        shiftHistory,
        openShift,
        recordCashMovement,
        closeShift,
        config,
        updateConfig,
        resetAllData,
        scanBarcode,
        activeTab,
        setActiveTab,
        activeReceiptOrder,
        setActiveReceiptOrder,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
