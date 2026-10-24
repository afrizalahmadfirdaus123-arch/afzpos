import { Category, Product, StoreConfig, Discount } from '../types/pos';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Items', icon: 'Grid' },
  { id: 'coffee', name: 'Coffee & Espresso', icon: 'Coffee' },
  { id: 'bakery', name: 'Artisanal Bakery', icon: 'Croissant' },
  { id: 'bistro', name: 'Bistro & Kitchen', icon: 'Utensils' },
  { id: 'beverages', name: 'Cold Beverages', icon: 'CupSoda' },
  { id: 'retail', name: 'Retail & Merch', icon: 'Package' }
];

export const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'staff', label: 'Staff Discount (20%)', type: 'percentage', value: 20 },
  { id: 'happy_hour', label: 'Happy Hour (15%)', type: 'percentage', value: 15 },
  { id: 'student', label: 'Student Discount (10%)', type: 'percentage', value: 10 },
  { id: 'voucher_5', label: 'Loyalty Voucher ($5.00)', type: 'fixed', value: 5.00 },
  { id: 'voucher_10', label: 'VIP Voucher ($10.00)', type: 'fixed', value: 10.00 }
];

export interface GalleryImage {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const APP_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'gal_latte',
    name: 'Artisan Hot Latte',
    category: 'Coffee',
    url: '/src/assets/images/pos_coffee_latte_1792822015620.jpg'
  },
  {
    id: 'gal_cold_brew',
    name: 'Nitro Cold Brew Bottle',
    category: 'Coffee',
    url: '/src/assets/images/pos_cold_brew_bottle_1792822016788.jpg'
  },
  {
    id: 'gal_matcha',
    name: 'Ceremonial Matcha Iced',
    category: 'Beverages',
    url: '/src/assets/images/pos_matcha_drink_1792824433107.jpg'
  },
  {
    id: 'gal_croissant',
    name: 'Butter Flaky Croissant',
    category: 'Bakery',
    url: '/src/assets/images/pos_croissant_pastry_1792822016692.jpg'
  },
  {
    id: 'gal_panini',
    name: 'Truffle Mushroom Panini',
    category: 'Bistro',
    url: '/src/assets/images/pos_panini_sandwich_1792824462130.jpg'
  },
  {
    id: 'gal_avocado',
    name: 'Heirloom Avocado Toast',
    category: 'Bistro',
    url: '/src/assets/images/pos_avocado_toast_1792822016781.jpg'
  },
  {
    id: 'gal_beans',
    name: 'Specialty Coffee Whole Beans',
    category: 'Retail',
    url: '/src/assets/images/pos_coffee_beans_1792824447859.jpg'
  }
];

export const INITIAL_STORE_CONFIG: StoreConfig = {
  storeName: 'AFZPOS ARTISAN COFFEE & BISTRO',
  taxRate: 8.25,
  currencySymbol: '$',
  currencyCode: 'USD',
  language: 'id', // Default to Indonesian as requested by user!
  addressLine1: '452 St. Nicholas Boulevard',
  addressLine2: 'Metropolis, NY 10027',
  phone: '(212) 555-0184',
  receiptHeaderMsg: 'Freshly Roasted & Crafted Daily',
  receiptFooterMsg: 'Thank you for your visit! Follow @afzpos for specials.',
  soundEnabled: true,
  defaultCashier: 'Jordan M. (Lead Cashier)',
  enableBarcodeScanner: true,
  whatsappNumber: '+6281234567890',
  whatsappRecipientName: 'Owner AfzPOS',
  autoSendWhatsAppDaily: true,
  whatsappDailyTime: '21:00',
  lowStockDefaultThreshold: 15
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_latte',
    name: 'Artisan Latte',
    sku: 'COF-101',
    barcode: '890100101',
    categoryId: 'coffee',
    price: 5.25,
    costPrice: 1.10,
    stock: 140,
    minStockThreshold: 20,
    weight: 350,
    weightUnit: 'ml',
    image: '/src/assets/images/pos_coffee_latte_1792822015620.jpg',
    description: 'Double shot espresso, velvety steamed whole or plant milk with micro-foam latte art.',
    hasTax: true,
    available: true,
    colorTag: 'amber',
    modifiers: [
      {
        groupName: 'Size',
        options: [
          { id: 'sz_reg', name: 'Regular (12oz)', priceDelta: 0 },
          { id: 'sz_lrg', name: 'Large (16oz)', priceDelta: 0.75 }
        ]
      },
      {
        groupName: 'Milk Choice',
        options: [
          { id: 'milk_whole', name: 'Whole Milk', priceDelta: 0 },
          { id: 'milk_oat', name: 'Oat Milk (+0.75)', priceDelta: 0.75 },
          { id: 'milk_almond', name: 'Almond Milk (+0.75)', priceDelta: 0.75 }
        ]
      },
      {
        groupName: 'Extra Shot',
        options: [
          { id: 'shot_single', name: 'Standard (Double)', priceDelta: 0 },
          { id: 'shot_extra', name: 'Extra Espresso Shot (+1.00)', priceDelta: 1.00 }
        ]
      }
    ]
  },
  {
    id: 'prod_croissant',
    name: 'Flaky Butter Croissant',
    sku: 'BAK-201',
    barcode: '890100201',
    categoryId: 'bakery',
    price: 4.50,
    costPrice: 0.95,
    stock: 24,
    minStockThreshold: 15,
    weight: 120,
    weightUnit: 'g',
    image: '/src/assets/images/pos_croissant_pastry_1792822016692.jpg',
    description: 'Pure French butter layered lamination, baked golden every dawn.',
    hasTax: true,
    available: true,
    colorTag: 'yellow',
    modifiers: [
      {
        groupName: 'Preparation',
        options: [
          { id: 'prep_room', name: 'Room Temperature', priceDelta: 0 },
          { id: 'prep_warmed', name: 'Warmed Crispy', priceDelta: 0 },
          { id: 'prep_butter_jam', name: 'With Butter & Strawberry Jam (+0.50)', priceDelta: 0.50 }
        ]
      }
    ]
  },
  {
    id: 'prod_avocado_toast',
    name: 'Heirloom Avocado Toast',
    sku: 'BIS-301',
    barcode: '890100301',
    categoryId: 'bistro',
    price: 12.50,
    costPrice: 3.20,
    stock: 35,
    minStockThreshold: 15,
    weight: 280,
    weightUnit: 'g',
    image: '/src/assets/images/pos_avocado_toast_1792822016781.jpg',
    description: 'Crushed Hass avocado on toasted country sourdough, soft organic poached egg, watermelon radish.',
    hasTax: true,
    available: true,
    colorTag: 'emerald',
    modifiers: [
      {
        groupName: 'Protein Add-on',
        options: [
          { id: 'pro_egg', name: 'Included Poached Egg', priceDelta: 0 },
          { id: 'pro_salmon', name: 'Add Smoked Salmon (+4.00)', priceDelta: 4.00 },
          { id: 'pro_bacon', name: 'Add Applewood Bacon (+3.00)', priceDelta: 3.00 }
        ]
      }
    ]
  },
  {
    id: 'prod_cold_brew',
    name: 'Nitro Single-Origin Cold Brew',
    sku: 'COF-102',
    barcode: '890100102',
    categoryId: 'coffee',
    price: 5.75,
    costPrice: 1.05,
    stock: 60,
    minStockThreshold: 15,
    weight: 350,
    weightUnit: 'ml',
    image: '/src/assets/images/pos_cold_brew_bottle_1792822016788.jpg',
    description: 'Steeped for 20 hours with Ethiopian Yirgacheffe beans, nitrogen-infused creamy pour.',
    hasTax: true,
    available: true,
    colorTag: 'slate',
    modifiers: [
      {
        groupName: 'Ice Level',
        options: [
          { id: 'ice_standard', name: 'Regular Ice', priceDelta: 0 },
          { id: 'ice_light', name: 'Light Ice', priceDelta: 0 },
          { id: 'ice_none', name: 'No Ice (Straight Nitro)', priceDelta: 0 }
        ]
      },
      {
        groupName: 'Sweetener',
        options: [
          { id: 'sw_unsweet', name: 'Unsweetened', priceDelta: 0 },
          { id: 'sw_vanilla', name: 'Madagascar Vanilla Syrup (+0.75)', priceDelta: 0.75 },
          { id: 'sw_caramel', name: 'Salted Caramel (+0.75)', priceDelta: 0.75 }
        ]
      }
    ]
  },
  {
    id: 'prod_flat_white',
    name: 'Aussie Flat White',
    sku: 'COF-103',
    barcode: '890100103',
    categoryId: 'coffee',
    price: 4.95,
    costPrice: 0.90,
    stock: 90,
    minStockThreshold: 20,
    weight: 200,
    weightUnit: 'ml',
    description: 'Double ristretto with micro-textured velvety milk in a 6oz ceramic cup.',
    hasTax: true,
    available: true,
    colorTag: 'amber'
  },
  {
    id: 'prod_cappuccino',
    name: 'Traditional Cappuccino',
    sku: 'COF-104',
    barcode: '890100104',
    categoryId: 'coffee',
    price: 4.85,
    costPrice: 0.85,
    stock: 85,
    minStockThreshold: 20,
    weight: 220,
    weightUnit: 'ml',
    description: 'Equal thirds espresso, steamed milk, and dense silky cloud foam with cocoa dusting.',
    hasTax: true,
    available: true,
    colorTag: 'amber'
  },
  {
    id: 'prod_pain_au_choc',
    name: 'Pain au Chocolat',
    sku: 'BAK-202',
    barcode: '890100202',
    categoryId: 'bakery',
    price: 4.95,
    costPrice: 1.10,
    stock: 18,
    minStockThreshold: 15,
    weight: 110,
    weightUnit: 'g',
    description: 'Golden flaky pastry filled with two batons of Valrhona 64% dark chocolate.',
    hasTax: true,
    available: true,
    colorTag: 'yellow'
  },
  {
    id: 'prod_almond_croissant',
    name: 'Twice-Baked Almond Croissant',
    sku: 'BAK-203',
    barcode: '890100203',
    categoryId: 'bakery',
    price: 5.50,
    costPrice: 1.30,
    stock: 6, // LOW STOCK: 6 < 15 threshold!
    minStockThreshold: 15,
    weight: 130,
    weightUnit: 'g',
    description: 'Filled with rich almond frangipane cream and topped with toasted flaked almonds.',
    hasTax: true,
    available: true,
    colorTag: 'yellow'
  },
  {
    id: 'prod_blueberry_scone',
    name: 'Wild Blueberry Scone',
    sku: 'BAK-204',
    barcode: '890100204',
    categoryId: 'bakery',
    price: 4.25,
    costPrice: 0.80,
    stock: 16,
    minStockThreshold: 15,
    weight: 140,
    weightUnit: 'g',
    description: 'Tender buttery crumb folded with wild Maine blueberries and citrus glaze.',
    hasTax: true,
    available: true,
    colorTag: 'yellow'
  },
  {
    id: 'prod_salmon_bagel',
    name: 'Smoked Salmon Bagel',
    sku: 'BIS-302',
    barcode: '890100302',
    categoryId: 'bistro',
    price: 13.95,
    costPrice: 4.10,
    stock: 22,
    minStockThreshold: 15,
    weight: 300,
    weightUnit: 'g',
    description: 'Everything bagel, house dill whipped cream cheese, cured lox, capers, pickled red onion.',
    hasTax: true,
    available: true,
    colorTag: 'emerald'
  },
  {
    id: 'prod_truffle_panini',
    name: 'Truffle Mushroom Panini',
    sku: 'BIS-303',
    barcode: '890100303',
    categoryId: 'bistro',
    price: 13.50,
    costPrice: 3.80,
    stock: 4, // LOW STOCK: 4 < 15 threshold!
    minStockThreshold: 15,
    weight: 320,
    weightUnit: 'g',
    image: '/src/assets/images/pos_panini_sandwich_1792824462130.jpg',
    description: 'Roasted cremini & shiitake, melted Fontina cheese, truffle aioli on pressed ciabatta.',
    hasTax: true,
    available: true,
    colorTag: 'emerald'
  },
  {
    id: 'prod_matcha_tonic',
    name: 'Sparkling Ceremonial Matcha',
    sku: 'BEV-401',
    barcode: '890100401',
    categoryId: 'beverages',
    price: 6.25,
    costPrice: 1.40,
    stock: 40,
    minStockThreshold: 15,
    weight: 350,
    weightUnit: 'ml',
    image: '/src/assets/images/pos_matcha_drink_1792824433107.jpg',
    description: 'Uji single-estate ceremonial matcha whisked fresh over artisanal tonic water and yuzu.',
    hasTax: true,
    available: true,
    colorTag: 'teal'
  },
  {
    id: 'prod_orange_juice',
    name: 'Cold-Pressed Valencia OJ',
    sku: 'BEV-402',
    barcode: '890100402',
    categoryId: 'beverages',
    price: 5.50,
    costPrice: 1.50,
    stock: 25,
    minStockThreshold: 15,
    weight: 300,
    weightUnit: 'ml',
    description: '100% pure raw unpasteurized Valencia oranges cold-pressed in-house daily.',
    hasTax: true,
    available: true,
    colorTag: 'orange'
  },
  {
    id: 'prod_hibiscus_tea',
    name: 'Iced Ruby Hibiscus Spritz',
    sku: 'BEV-403',
    barcode: '890100403',
    categoryId: 'beverages',
    price: 4.75,
    costPrice: 0.65,
    stock: 45,
    minStockThreshold: 15,
    weight: 350,
    weightUnit: 'ml',
    description: 'Tart hibiscus blossoms infused with lemongrass, crushed mint and sparkling water.',
    hasTax: true,
    available: true,
    colorTag: 'rose'
  },
  {
    id: 'prod_coffee_beans',
    name: 'House Blend Whole Bean (340g)',
    sku: 'RET-501',
    barcode: '890100501',
    categoryId: 'retail',
    price: 18.50,
    costPrice: 7.20,
    stock: 3, // LOW STOCK: 3 < 15 threshold!
    minStockThreshold: 15,
    weight: 340,
    weightUnit: 'g',
    image: '/src/assets/images/pos_coffee_beans_1792824447859.jpg',
    description: 'Medium roast blend with tasting notes of milk chocolate, candied orange, and honey.',
    hasTax: false,
    available: true,
    colorTag: 'purple'
  },
  {
    id: 'prod_ceramic_tumbler',
    name: 'Ceramic Thermal Tumbler 12oz',
    sku: 'RET-502',
    barcode: '890100502',
    categoryId: 'retail',
    price: 26.00,
    costPrice: 9.80,
    stock: 2, // LOW STOCK: 2 < 10 threshold!
    minStockThreshold: 10,
    weight: 380,
    weightUnit: 'g',
    description: 'Double-walled matte ceramic insulated travel mug with leak-resistant splash guard.',
    hasTax: true,
    available: true,
    colorTag: 'purple'
  }
];
