import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod, PaymentDetails, SplitPaymentDetail } from '../../types/pos';
import { formatCurrency, getQuickCashTenderOptions } from '../../utils/format';
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  Users,
  CheckCircle2,
  Delete,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Smartphone
} from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const { total, config, completeCurrentOrder, cart, t, language } = usePOS();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  // Cash Tab State
  const [cashTenderedStr, setCashTenderedStr] = useState<string>('');
  const cashTendered = parseFloat(cashTenderedStr) || 0;
  const changeDue = Math.max(0, cashTendered - total);
  const isCashSufficient = cashTendered >= total;

  // Card Tab State
  const [cardProcessing, setCardProcessing] = useState(false);
  const [cardSimulationOutcome, setCardSimulationOutcome] = useState<'approved' | 'declined'>('approved');
  const [cardDeclinedError, setCardDeclinedError] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardBrand, setCardBrand] = useState(config.currencySymbol === 'Rp' ? 'BCA Debit' : 'Visa');

  // Mobile Payment Tab State
  const [mobileProvider, setMobileProvider] = useState(config.currencySymbol === 'Rp' ? 'QRIS (GoPay/BCA/OVO/Dana)' : 'Apple Pay / Digital Wallet');
  const [mobileProcessing, setMobileProcessing] = useState(false);

  // Split Bill State
  const [splitCount, setSplitCount] = useState<number>(2);
  const [splitTenders, setSplitTenders] = useState<SplitPaymentDetail[]>([
    { method: 'cash', amount: Math.round(total / 2) },
    { method: 'card', amount: total - Math.round(total / 2), cardLast4: '8821' }
  ]);

  // Fast cash preset options tailored to Rupiah or USD
  const fastCashOptions = useMemo(() => {
    return getQuickCashTenderOptions(total, config.currencySymbol);
  }, [total, config.currencySymbol]);

  // Numpad input handler
  const handleNumpad = (char: string) => {
    if (char === 'C') {
      setCashTenderedStr('');
      return;
    }
    if (char === 'back') {
      setCashTenderedStr(prev => prev.slice(0, -1));
      return;
    }
    if (char === '000') {
      // 000 is handy for Rupiah transactions!
      if (!cashTenderedStr || cashTenderedStr === '0') return;
      setCashTenderedStr(prev => prev + '000');
      return;
    }
    if (char === '.' && cashTenderedStr.includes('.')) return;
    setCashTenderedStr(prev => prev + char);
  };

  // Complete Cash
  const handleCompleteCash = () => {
    if (!isCashSufficient) return;
    const payment: PaymentDetails = {
      method: 'cash',
      amountTendered: cashTendered,
      changeGiven: changeDue
    };
    completeCurrentOrder(payment);
    onClose();
  };

  // Complete Card (with simulation of approval / denial)
  const handleProcessCard = () => {
    setCardProcessing(true);
    setCardDeclinedError(null);

    setTimeout(() => {
      setCardProcessing(false);
      if (cardSimulationOutcome === 'declined') {
        setCardDeclinedError(
          language === 'id'
            ? 'Transaksi Ditolak: Saldo Tidak Cukup / Batas Transaksi Bank Terlampaui (Kode: 51)'
            : 'Transaction Declined: Insufficient Funds / Do Not Honor (Error Code: 51)'
        );
      } else {
        const payment: PaymentDetails = {
          method: 'card',
          cardBrand,
          cardLast4,
          cardStatus: 'approved',
          approvalCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}`
        };
        completeCurrentOrder(payment);
        onClose();
      }
    }, 700);
  };

  // Complete Mobile / QR
  const handleCompleteMobile = () => {
    setMobileProcessing(true);
    setTimeout(() => {
      setMobileProcessing(false);
      const payment: PaymentDetails = {
        method: 'qr',
        qrProvider: mobileProvider,
        approvalCode: `QRIS_${Math.floor(100000 + Math.random() * 900000)}`
      };
      completeCurrentOrder(payment);
      onClose();
    }, 500);
  };

  // Complete Split
  const handleCompleteSplit = () => {
    const payment: PaymentDetails = {
      method: 'split',
      splitBreakdown: splitTenders
    };
    completeCurrentOrder(payment);
    onClose();
  };

  const handleUpdateSplitCount = (count: number) => {
    setSplitCount(count);
    const equalShare = Math.round(total / count);
    const newTenders: SplitPaymentDetail[] = [];
    let accumulated = 0;
    for (let i = 0; i < count; i++) {
      const share = i === count - 1 ? total - accumulated : equalShare;
      accumulated += share;
      newTenders.push({
        method: i % 2 === 0 ? 'cash' : 'card',
        amount: share,
        cardLast4: i % 2 === 0 ? undefined : `${1000 + i * 234}`
      });
    }
    setSplitTenders(newTenders);
  };

  if (cart.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-slate-950">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">
              {t('totalAmountDue')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                {formatCurrency(total, config.currencySymbol, config.currencyCode)}
              </span>
              <span className="text-xs text-slate-500 font-mono">({cart.length} items)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-4 p-2 bg-slate-950/60 border-b border-slate-800 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedMethod('cash')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedMethod === 'cash'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{t('cash')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedMethod === 'card'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('card')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('qr')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedMethod === 'qr'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t('qrMobile')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('split')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedMethod === 'split'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('split')}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ================= 1. CASH PAYMENT ================= */}
          {selectedMethod === 'cash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Quick Bills & Change Display */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    {t('quickCashTender')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {fastCashOptions.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTenderedStr(amt.toString())}
                        className={`p-3 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center justify-between ${
                          cashTendered === amt
                            ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                            : 'bg-slate-800/80 border-slate-700/80 text-white hover:bg-slate-750'
                        }`}
                      >
                        <span>{amt === total ? t('exactAmount') : formatCurrency(amt, config.currencySymbol, config.currencyCode)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Due Box */}
                <div className={`p-4 rounded-xl border ${
                  isCashSufficient
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : 'bg-slate-800/50 border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t('tendered')}</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatCurrency(cashTendered, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                    <span className={`text-sm font-bold ${isCashSufficient ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {t('changeDue')}
                    </span>
                    <span className={`text-2xl font-mono font-bold tabular-nums ${isCashSufficient ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {formatCurrency(changeDue, config.currencySymbol, config.currencyCode)}
                    </span>
                  </div>

                  {!isCashSufficient && cashTendered > 0 && (
                    <p className="text-[11px] text-amber-400 mt-2 font-mono">
                      {t('stillNeeds')} {formatCurrency(total - cashTendered, config.currencySymbol, config.currencyCode)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!isCashSufficient}
                  onClick={handleCompleteCash}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Banknote className="w-5 h-5" />
                  <span>{t('completeCashSale')}</span>
                </button>
              </div>

              {/* Right Column: Tactile Numpad with Rupiah 000 support */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col">
                <div className="mb-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-right font-mono text-xl font-bold text-white tracking-wider">
                  {cashTenderedStr ? formatCurrency(parseFloat(cashTenderedStr), config.currencySymbol, config.currencyCode) : formatCurrency(0, config.currencySymbol, config.currencyCode)}
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '.'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleNumpad(val)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-base rounded-lg transition-colors active:scale-95"
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleNumpad('C')}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-lg transition-colors"
                  >
                    Clear (C)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpad('back')}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold rounded-lg transition-colors"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. CARD WITH SIMULATED APPROVAL / DENIAL ================= */}
          {selectedMethod === 'card' && (
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <CreditCard className="w-8 h-8 stroke-1" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">{t('readyForCard')}</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {t('cardInstructions')}
                </p>
              </div>

              {/* Simulation Mode Toggle (Approval vs Denial) */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 w-full max-w-sm space-y-2 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Simulated Terminal Mode:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCardSimulationOutcome('approved');
                      setCardDeclinedError(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                      cardSimulationOutcome === 'approved'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('simulateApproval')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCardSimulationOutcome('declined');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                      cardSimulationOutcome === 'declined'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('simulateDenial')}</span>
                  </button>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
                <select
                  value={cardBrand}
                  onChange={e => setCardBrand(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                >
                  <option value="BCA Debit">BCA Debit</option>
                  <option value="Mandiri Debit">Mandiri Debit</option>
                  <option value="BRI Debit">BRI Debit</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">Amex</option>
                </select>

                <div className="flex items-center gap-1 text-xs font-mono text-slate-300">
                  <span>*{cardLast4}</span>
                </div>
              </div>

              {/* Declined Error Display */}
              {cardDeclinedError && (
                <div className="w-full max-w-sm p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-xl text-left space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{t('declinedTitle')}</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-tight">
                    {cardDeclinedError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={cardProcessing}
                onClick={handleProcessCard}
                className={`w-full max-w-sm py-3.5 px-6 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  cardSimulationOutcome === 'declined'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                {cardProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : cardDeclinedError ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('tryAgain')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t('authorizeCard')} {formatCurrency(total, config.currencySymbol, config.currencyCode)}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= 3. MOBILE PAYMENTS & QRIS INTEGRATION ================= */}
          {selectedMethod === 'qr' && (
            <div className="flex flex-col items-center justify-center py-2 text-center space-y-4">
              {/* QR Code Container with QRIS Branding */}
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-400 inline-block text-slate-950 relative">
                <div className="text-[10px] font-extrabold tracking-widest uppercase mb-1 text-center font-sans border-b border-slate-300 pb-0.5">
                  QRIS · PEMBAYARAN DIGITAL
                </div>
                {/* Clean Scalable QR Matrix */}
                <svg width="150" height="150" viewBox="0 0 160 160" className="mx-auto text-slate-950">
                  <rect x="10" y="10" width="40" height="40" fill="currentColor" rx="4" />
                  <rect x="18" y="18" width="24" height="24" fill="white" rx="2" />
                  <rect x="24" y="24" width="12" height="12" fill="currentColor" rx="1" />

                  <rect x="110" y="10" width="40" height="40" fill="currentColor" rx="4" />
                  <rect x="118" y="18" width="24" height="24" fill="white" rx="2" />
                  <rect x="124" y="24" width="12" height="12" fill="currentColor" rx="1" />

                  <rect x="10" y="110" width="40" height="40" fill="currentColor" rx="4" />
                  <rect x="18" y="118" width="24" height="24" fill="white" rx="2" />
                  <rect x="124" y="124" width="12" height="12" fill="currentColor" rx="1" />

                  <rect x="60" y="15" width="8" height="8" fill="currentColor" />
                  <rect x="75" y="15" width="8" height="8" fill="currentColor" />
                  <rect x="90" y="25" width="8" height="8" fill="currentColor" />
                  <rect x="60" y="35" width="16" height="8" fill="currentColor" />
                  <rect x="85" y="45" width="8" height="8" fill="currentColor" />

                  <rect x="15" y="65" width="8" height="8" fill="currentColor" />
                  <rect x="35" y="75" width="16" height="8" fill="currentColor" />
                  <rect x="65" y="65" width="12" height="12" fill="currentColor" />
                  <rect x="85" y="70" width="12" height="12" fill="currentColor" />
                  <rect x="115" y="65" width="8" height="16" fill="currentColor" />
                  <rect x="135" y="75" width="12" height="8" fill="currentColor" />

                  <rect x="65" y="95" width="12" height="8" fill="currentColor" />
                  <rect x="85" y="90" width="8" height="16" fill="currentColor" />
                  <rect x="105" y="105" width="16" height="8" fill="currentColor" />
                  <rect x="130" y="105" width="8" height="8" fill="currentColor" />

                  <rect x="60" y="125" width="16" height="12" fill="currentColor" />
                  <rect x="90" y="130" width="8" height="8" fill="currentColor" />
                  <rect x="110" y="125" width="12" height="12" fill="currentColor" />
                  <rect x="130" y="135" width="12" height="8" fill="currentColor" />
                </svg>
                <div className="text-[9px] font-mono font-bold text-center mt-1 text-slate-700">
                  {formatCurrency(total, config.currencySymbol, config.currencyCode)}
                </div>
              </div>

              {/* Supported Wallets info */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>{t('scanToPayQR')}</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {t('qrInstructions')}
                </p>
              </div>

              {/* Mobile Provider Selector */}
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>E-Wallet:</span>
                <select
                  value={mobileProvider}
                  onChange={e => setMobileProvider(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                >
                  <option value="QRIS (BCA/Mandiri/BRI)">QRIS Standar Nasional</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="Dana">Dana</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="Apple Pay / Google Wallet">Apple / Google Pay</option>
                </select>
              </div>

              <button
                type="button"
                disabled={mobileProcessing}
                onClick={handleCompleteMobile}
                className="w-full max-w-sm py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {mobileProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying QRIS Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('confirmQRPaid')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= 4. SPLIT BILL ================= */}
          {selectedMethod === 'split' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300">{t('splitEvenly')}</span>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleUpdateSplitCount(n)}
                      className={`w-8 h-7 text-xs rounded font-bold transition-colors ${
                        splitCount === n
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenders list */}
              <div className="space-y-3">
                {splitTenders.map((tender, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{t('guest')} #{idx + 1}</span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        {tender.method} {tender.cardLast4 ? `(*${tender.cardLast4})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={tender.method}
                        onChange={e => {
                          const m = e.target.value as 'cash' | 'card' | 'qr';
                          setSplitTenders(prev =>
                            prev.map((t, i) => (i === idx ? { ...t, method: m } : t))
                          );
                        }}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                      >
                        <option value="cash">{t('cash')}</option>
                        <option value="card">{t('card')}</option>
                        <option value="qr">QRIS</option>
                      </select>

                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                          {formatCurrency(tender.amount, config.currencySymbol, config.currencyCode)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCompleteSplit}
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('completeSplit')} ({splitCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
