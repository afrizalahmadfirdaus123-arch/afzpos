import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/pos/Header';
import { RegisterView } from './components/pos/RegisterView';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { OrdersHistoryView } from './components/pos/OrdersHistoryView';
import { ReportsView } from './components/pos/ReportsView';
import { DrawerShiftView } from './components/pos/DrawerShiftView';
import { InventoryView } from './components/pos/InventoryView';
import { SettingsView } from './components/pos/SettingsView';

const TerminalScreen: React.FC = () => {
  const { activeTab, setActiveTab, activeReceiptOrder, setActiveReceiptOrder, cart } = usePOS();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Global POS Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when inside inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('register');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('orders');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('drawer');
      } else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setActiveReceiptOrder(null);
      } else if (e.key === ' ' && cart.length > 0 && activeTab === 'register' && !showPaymentModal) {
        // Spacebar to pay
        e.preventDefault();
        setShowPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, cart.length, showPaymentModal, setActiveTab, setActiveReceiptOrder]);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header conforming to Top Bar Contract */}
      <Header />

      {/* Main Active Module Screen */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'register' && (
          <RegisterView onOpenPayment={() => setShowPaymentModal(true)} />
        )}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'orders' && <OrdersHistoryView />}
        {activeTab === 'drawer' && <DrawerShiftView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Payment Checkout Modal */}
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}

      {/* Thermal Receipt Print & Review Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <TerminalScreen />
    </POSProvider>
  );
}