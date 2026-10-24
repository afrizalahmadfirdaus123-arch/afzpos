import React, { useState } from 'react';
import { Product, SelectedModifier } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { formatCurrency } from '../../utils/format';
import { X, Plus, Minus } from 'lucide-react';

interface ItemCustomizerModalProps {
  product: Product;
  onClose: () => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({ product, onClose }) => {
  const { addToCart, config } = usePOS();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(() => {
    if (!product.modifiers) return [];
    return product.modifiers.map(group => {
      const defaultOption = group.options[0];
      return {
        groupName: group.groupName,
        modifierId: defaultOption.id,
        name: defaultOption.name,
        priceDelta: defaultOption.priceDelta
      };
    });
  });

  const handleSelectModifier = (groupName: string, optionId: string) => {
    const group = product.modifiers?.find(g => g.groupName === groupName);
    if (!group) return;
    const option = group.options.find(o => o.id === optionId);
    if (!option) return;

    setSelectedModifiers(prev => {
      const filtered = prev.filter(m => m.groupName !== groupName);
      return [
        ...filtered,
        {
          groupName,
          modifierId: option.id,
          name: option.name,
          priceDelta: option.priceDelta
        }
      ];
    });
  };

  const modifierTotal = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
  const unitPriceWithModifiers = product.price + modifierTotal;
  const itemTotal = unitPriceWithModifiers * quantity;

  const handleConfirm = () => {
    addToCart(product, selectedModifiers, note.trim(), quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.sku} · {formatCurrency(product.price, config.currencySymbol, config.currencyCode)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {product.modifiers && product.modifiers.map(group => {
            const currentSelection = selectedModifiers.find(m => m.groupName === group.groupName);
            return (
              <div key={group.groupName} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {group.groupName}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.options.map(option => {
                    const isSelected = currentSelection?.modifierId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectModifier(group.groupName, option.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <span>{option.name}</span>
                        {option.priceDelta !== 0 && (
                          <span className="font-mono text-slate-400">
                            {option.priceDelta > 0
                              ? `+${formatCurrency(option.priceDelta, config.currencySymbol, config.currencyCode)}`
                              : `-${formatCurrency(Math.abs(option.priceDelta), config.currencySymbol, config.currencyCode)}`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Instruksi / Catatan Khusus
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="cth: Lebih panas, pisahkan gula, sedikit es..."
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Jumlah</span>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-bold text-sm text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400 block">Subtotal Item</span>
            <span className="text-lg font-bold font-mono text-white">
              {formatCurrency(itemTotal, config.currencySymbol, config.currencyCode)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            Tambahkan ke Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};
