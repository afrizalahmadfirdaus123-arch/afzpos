import React, { useState, useEffect } from 'react';
import { Order } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { formatCurrency } from '../../utils/format';
import { bluetoothPrinter, BluetoothPrinterState } from '../../utils/bluetoothPrinter';
import { Printer, Check, X, Share2, Bluetooth, RefreshCw } from 'lucide-react';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import { isNativeApp } from '../../utils/nativeBridge';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { config, setActiveReceiptOrder, t, language } = usePOS();
  const [copied, setCopied] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(bluetoothPrinter.getState());
  const [btPrinting, setBtPrinting] = useState(false);
  const [btSuccess, setBtSuccess] = useState(false);
  const [showBtModal, setShowBtModal] = useState(false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(setBtState);
    return () => unsub();
  }, []);

  const formattedDate = new Date(order.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handlePrint = () => {
    // WebView Android tidak mendukung window.print(); di aplikasi, cetak lewat printer Bluetooth
    if (isNativeApp()) {
      void handleBluetoothPrint();
      return;
    }
    window.print();
  };

  const handleBluetoothPrint = async () => {
    if (!btState.isConnected) {
      setShowBtModal(true);
      return;
    }

    setBtPrinting(true);
    setBtSuccess(false);
    try {
      await bluetoothPrinter.printOrderReceipt(order, config);
      setBtSuccess(true);
      setTimeout(() => setBtSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setShowBtModal(true);
    } finally {
      setBtPrinting(false);
    }
  };

  const handleCopyText = () => {
    let receiptText = `${config.storeName}\n`;
    receiptText += `${config.addressLine1}\n${config.addressLine2}\nTel: ${config.phone}\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `${t('receiptNumber')} ${order.formattedOrderNumber}\n`;
    receiptText += `${t('dateTime')} ${formattedDate} ${formattedTime}\n`;
    receiptText += `${t('cashier')} ${order.cashierName}\n`;
    receiptText += `${t('service')} ${order.diningOption.toUpperCase()} - ${order.tableOrCustomer}\n`;
    receiptText += `--------------------------------\n`;

    order.items.forEach(item => {
      const weightInfo = item.weight && item.weightUnit ? ` (${item.weight}${item.weightUnit})` : '';
      receiptText += `${item.quantity}x ${item.name}${weightInfo} - ${formatCurrency(item.finalPrice * item.quantity, config.currencySymbol, config.currencyCode)}\n`;
      if (item.selectedModifiers.length > 0) {
        item.selectedModifiers.forEach(m => {
          receiptText += `   + ${m.name}\n`;
        });
      }
      if (item.itemNote) {
        receiptText += `   Note: ${item.itemNote}\n`;
      }
    });

    receiptText += `--------------------------------\n`;
    receiptText += `${t('subtotal')}: ${formatCurrency(order.subtotal, config.currencySymbol, config.currencyCode)}\n`;
    if (order.discountAmount > 0) {
      receiptText += `${t('discount')}: -${formatCurrency(order.discountAmount, config.currencySymbol, config.currencyCode)}\n`;
    }
    receiptText += `${t('tax')} (${order.taxRate}%): ${formatCurrency(order.taxAmount, config.currencySymbol, config.currencyCode)}\n`;
    if (order.tipAmount > 0) {
      receiptText += `${t('tip')}: ${formatCurrency(order.tipAmount, config.currencySymbol, config.currencyCode)}\n`;
    }
    receiptText += `TOTAL: ${formatCurrency(order.total, config.currencySymbol, config.currencyCode)}\n`;
    receiptText += `--------------------------------\n`;
    receiptText += `${t('paymentTender')} ${order.paymentDetails.method.toUpperCase()}\n`;
    if (order.paymentDetails.amountTendered !== undefined) {
      receiptText += `${t('cashTendered')} ${formatCurrency(order.paymentDetails.amountTendered, config.currencySymbol, config.currencyCode)}\n`;
      receiptText += `${t('changeGiven')} ${formatCurrency(order.paymentDetails.changeGiven || 0, config.currencySymbol, config.currencyCode)}\n`;
    }
    receiptText += `\n${config.receiptFooterMsg}\n`;

    navigator.clipboard.writeText(receiptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDone = () => {
    setActiveReceiptOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full my-auto flex flex-col items-center">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between mb-3 text-white px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            {t('receiptTitle')} #{order.orderNumber}
          </span>
          <button
            onClick={handleDone}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper Container */}
        <div
          id="thermal-receipt-print-area"
          className="w-full bg-[#fbfbf8] text-slate-900 rounded-lg p-6 shadow-2xl font-mono text-xs border border-stone-200 select-text leading-relaxed relative"
        >
          {/* Header */}
          <div className="w-full border-b border-dashed border-stone-400 pb-4 text-center">
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-stone-900 font-sans">
              {config.storeName}
            </h2>
            <p className="text-[11px] text-stone-600 mt-1">{config.addressLine1}</p>
            <p className="text-[11px] text-stone-600">{config.addressLine2}</p>
            <p className="text-[11px] text-stone-600">Tel: {config.phone}</p>
            {config.receiptHeaderMsg && (
              <p className="text-[10px] text-stone-500 italic mt-1">{config.receiptHeaderMsg}</p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="py-3 border-b border-dashed border-stone-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">{t('receiptNumber')}</span>
              <span className="font-bold">{order.formattedOrderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t('dateTime')}</span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t('cashier')}</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t('service')}</span>
              <span className="font-bold capitalize">{order.diningOption.replace('_', ' ')} ({order.tableOrCustomer})</span>
            </div>
          </div>

          {/* Line items list */}
          <div className="py-3 border-b border-dashed border-stone-300 space-y-2">
            {order.items.map(item => (
              <div key={item.cartItemId} className="space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span className="flex-1 pr-2">
                    {item.quantity > 1 && <span className="font-bold">{item.quantity}x </span>}
                    {item.name}
                    {item.weight && item.weightUnit && (
                      <span className="text-[10px] text-stone-500 font-sans ml-1">
                        ({item.weight}{item.weightUnit})
                      </span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(item.finalPrice * item.quantity, config.currencySymbol, config.currencyCode)}
                  </span>
                </div>

                {item.selectedModifiers.length > 0 && (
                  <div className="text-[10px] text-stone-500 pl-3">
                    {item.selectedModifiers.map(m => (
                      <div key={m.modifierId}>+ {m.name}</div>
                    ))}
                  </div>
                )}

                {item.itemNote && (
                  <div className="text-[10px] text-stone-500 italic pl-3">
                    * {item.itemNote}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pricing Math */}
          <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-600">{t('subtotal')}:</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal, config.currencySymbol, config.currencyCode)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-stone-700">
                <span>{t('discount')} ({order.discountApplied?.label}):</span>
                <span className="tabular-nums">-{formatCurrency(order.discountAmount, config.currencySymbol, config.currencyCode)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-stone-600">{t('tax')} ({order.taxRate}%):</span>
              <span className="tabular-nums">{formatCurrency(order.taxAmount, config.currencySymbol, config.currencyCode)}</span>
            </div>

            {order.tipAmount > 0 && (
              <div className="flex justify-between text-stone-700">
                <span>{t('tip')}:</span>
                <span className="tabular-nums">+{formatCurrency(order.tipAmount, config.currencySymbol, config.currencyCode)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-300">
              <span>{t('grandTotal')}:</span>
              <span className="tabular-nums">{formatCurrency(order.total, config.currencySymbol, config.currencyCode)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="py-3 border-b border-dashed border-stone-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-600">{t('paymentTender')}</span>
              <span className="font-bold uppercase">{order.paymentDetails.method === 'qr' ? 'QRIS' : order.paymentDetails.method}</span>
            </div>

            {order.paymentDetails.method === 'cash' && order.paymentDetails.amountTendered !== undefined && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-600">{t('cashTendered')}</span>
                  <span className="tabular-nums">{formatCurrency(order.paymentDetails.amountTendered, config.currencySymbol, config.currencyCode)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-stone-600">{t('changeGiven')}</span>
                  <span className="tabular-nums">{formatCurrency(order.paymentDetails.changeGiven || 0, config.currencySymbol, config.currencyCode)}</span>
                </div>
              </>
            )}

            {order.paymentDetails.method === 'card' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-600">{t('cardBrand')}:</span>
                  <span>{order.paymentDetails.cardBrand || 'Card'} *{order.paymentDetails.cardLast4 || '4242'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Auth Code:</span>
                  <span className="text-[10px]">{order.paymentDetails.approvalCode || 'AUTH_992182'}</span>
                </div>
              </>
            )}

            {order.paymentDetails.method === 'qr' && (
              <div className="flex justify-between">
                <span className="text-stone-600">E-Wallet:</span>
                <span>{order.paymentDetails.qrProvider || 'QRIS Digital'}</span>
              </div>
            )}
          </div>

          {/* Barcode representation */}
          <div className="py-4 text-center">
            <div className="flex justify-center items-center gap-0.5 h-10 mb-1 opacity-80">
              {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7].map((w, idx) => (
                <div
                  key={idx}
                  style={{ width: `${(w % 3) + 1}px` }}
                  className="bg-black h-full"
                />
              ))}
            </div>
            <p className="text-[10px] text-stone-500 font-mono tracking-widest">
              *{order.id.slice(0, 16)}*
            </p>
          </div>

          {/* Receipt Footer Message */}
          <div className="pt-2 text-center text-[10px] text-stone-600 leading-tight">
            <p>{config.receiptFooterMsg}</p>
          </div>
        </div>

        {/* Action Buttons with Bluetooth Printer integration */}
        <div className="w-full space-y-2 mt-4">
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Bluetooth Thermal Print Button */}
            <button
              type="button"
              disabled={btPrinting}
              onClick={handleBluetoothPrint}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                btState.isConnected
                  ? 'bg-blue-500 hover:bg-blue-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30'
              }`}
            >
              {btPrinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim ke Printer...</span>
                </>
              ) : btSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Struk Terkirim!</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" />
                  <span>
                    {btState.isConnected ? `Cetak Bluetooth (${btState.paperWidth})` : 'Hubungkan BT Printer'}
                  </span>
                </>
              )}
            </button>

            {/* 2. Standard System Thermal Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{t('printReceipt')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>{t('copyTxt')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDone}
              className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{t('nextSale')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bluetooth Pairing Modal */}
      {showBtModal && (
        <BluetoothPrinterModal onClose={() => setShowBtModal(false)} />
      )}
    </div>
  );
};
