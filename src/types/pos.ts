import { Language } from '../utils/translations';

export type { Language };

export interface ProductModifier {
  id: string;
  name: string;
  priceDelta: number;
}

export type WeightUnit = 'g' | 'kg' | 'mg' | 'oz' | 'lb' | 'ml' | 'l' | 'pcs';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockThreshold?: number; // Reorder alert threshold
  weight?: number; // Weight/volume value, e.g. 250, 500, 1
  weightUnit?: WeightUnit; // Unit of weight: 'g', 'kg', 'oz', 'lb', 'ml', 'l', 'pcs'
  image?: string;
  description: string;
  hasTax: boolean;
  available: boolean;
  colorTag?: string;
  modifiers?: {
    groupName: string;
    options: ProductModifier[];
  }[];
}

export interface SelectedModifier {
  groupName: string;
  modifierId: string;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  weight?: number;
  weightUnit?: WeightUnit;
  selectedModifiers: SelectedModifier[];
  itemNote?: string;
  finalPrice: number; // unitPrice + modifiers sum
  hasTax: boolean;
}

export interface Discount {
  id: string;
  label: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export type DiningOption = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'qr' | 'split';

export interface SplitPaymentDetail {
  method: 'cash' | 'card' | 'qr';
  amount: number;
  tendered?: number;
  change?: number;
  cardLast4?: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amountTendered?: number;
  changeGiven?: number;
  cardLast4?: string;
  cardBrand?: string;
  approvalCode?: string;
  cardStatus?: 'approved' | 'declined';
  declineReason?: string;
  qrProvider?: string;
  splitBreakdown?: SplitPaymentDetail[];
}

export interface Order {
  id: string;
  orderNumber: number;
  formattedOrderNumber: string;
  createdAt: number;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountApplied?: Discount;
  taxRate: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  diningOption: DiningOption;
  tableOrCustomer: string;
  cashierName: string;
  paymentDetails: PaymentDetails;
  status: 'completed' | 'parked' | 'refunded';
  refundDetails?: {
    refundedAt: number;
    reason: string;
    refundedBy: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CashMovement {
  id: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  reason: string;
  cashierName: string;
  timestamp: number;
}

export interface DrawerSession {
  id: string;
  openedAt: number;
  closedAt?: number;
  cashierName: string;
  startingFloat: number;
  cashSales: number;
  cardSales: number;
  qrSales: number;
  movements: CashMovement[];
  countedCashAtClose?: number;
  expectedCashAtClose?: number;
  variance?: number;
  note?: string;
}

export interface StoreConfig {
  storeName: string;
  taxRate: number;
  currencySymbol: string;
  currencyCode: string;
  language: Language;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  receiptHeaderMsg: string;
  receiptFooterMsg: string;
  soundEnabled: boolean;
  defaultCashier: string;
  enableBarcodeScanner: boolean;
  whatsappNumber?: string;
  whatsappRecipientName?: string;
  autoSendWhatsAppDaily?: boolean;
  whatsappDailyTime?: string;
  lowStockDefaultThreshold?: number;
}

export type SalesReportPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

export interface ProductSalesStat {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  grossRevenue: number;
  sharePercentage: number;
}

export interface SalesReport {
  period: SalesReportPeriod;
  startDate: number;
  endDate: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalTax: number;
  totalTips: number;
  totalDiscounts: number;
  transactionCount: number;
  averageTransactionValue: number;
  paymentMethodTotals: {
    cash: number;
    card: number;
    qr: number;
  };
  productStats: ProductSalesStat[];
}
