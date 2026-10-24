import React, { useState, useEffect } from 'react';
import { bluetoothPrinter, BluetoothPrinterState } from '../../utils/bluetoothPrinter';
import { isNativeApp } from '../../utils/nativeBridge';
import { usePOS } from '../../context/POSContext';
import {
  Printer,
  X,
  Bluetooth,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Battery,
  Sliders,
  FileText
} from 'lucide-react';

interface BluetoothPrinterModalProps {
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ onClose }) => {
  const { config, t, language } = usePOS();
  const [state, setState] = useState<BluetoothPrinterState>(bluetoothPrinter.getState());
  const [testPrintLoading, setTestPrintLoading] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = bluetoothPrinter.subscribe(setState);
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    await bluetoothPrinter.connect();
  };

  const handleConnectVirtual = () => {
    bluetoothPrinter.connectVirtualDemo('Thermal Printer BLE (MPT-02 58mm)');
  };

  const handleDisconnect = () => {
    bluetoothPrinter.disconnect();
  };

  const handleTestPrint = async () => {
    setTestPrintLoading(true);
    setTestPrintSuccess(false);
    try {
      await bluetoothPrinter.printTestReceipt(config);
      setTestPrintSuccess(true);
      setTimeout(() => setTestPrintSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setTestPrintLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'id' ? 'Printer Thermal Bluetooth' : 'Bluetooth Thermal Printer'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'id' ? 'Koneksi nirkabel printer struk ESC/POS' : 'Wireless ESC/POS thermal receipt printer'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Display Card */}
        <div className={`p-4 rounded-xl border ${
          state.isConnected
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-slate-800/60 border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {language === 'id' ? 'Status Koneksi' : 'Connection Status'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={`text-xs font-bold ${state.isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                {state.isConnected
                  ? (language === 'id' ? 'Terhubung' : 'Connected')
                  : (language === 'id' ? 'Terputus' : 'Disconnected')}
              </span>
            </div>
          </div>

          {state.isConnected && (
            <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'id' ? 'Nama Perangkat:' : 'Device Name:'}</span>
                <span className="font-semibold text-white">{state.deviceName}</span>
              </div>

              {state.batteryLevel !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{language === 'id' ? 'Baterai Printer:' : 'Printer Battery:'}</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <Battery className="w-3.5 h-3.5" />
                    {state.batteryLevel}%
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400">{language === 'id' ? 'Mode Printer:' : 'Driver Mode:'}</span>
                <span className="font-mono text-amber-400 text-[11px]">
                  {state.isVirtualDemo ? 'Virtual Simulated BLE' : (isNativeApp() ? 'Android BLE GATT' : 'Standard Web Bluetooth GATT')}
                </span>
              </div>
            </div>
          )}

          {state.lastError && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{state.lastError}</span>
            </div>
          )}
        </div>

        {/* Paper Width Settings */}
        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'id' ? 'Ukuran Lebar Kertas Struk' : 'Thermal Paper Width'}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => bluetoothPrinter.setPaperWidth('58mm')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                state.paperWidth === '58mm'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>58mm (Mobile / Mini)</span>
              <span className="font-mono text-[10px]">32 Kolom</span>
            </button>

            <button
              type="button"
              onClick={() => bluetoothPrinter.setPaperWidth('80mm')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                state.paperWidth === '80mm'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>80mm (Desktop / Kasir)</span>
              <span className="font-mono text-[10px]">48 Kolom</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          {!state.isConnected ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={state.isConnecting}
                onClick={handleConnect}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {state.isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mencari Perangkat Bluetooth...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    <span>{language === 'id' ? 'Pindai & Hubungkan Printer Bluetooth' : 'Scan & Pair Bluetooth Printer'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleConnectVirtual}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'id' ? 'Gunakan Printer Demo Virtual (Untuk Pengujian)' : 'Use Demo Virtual Printer (For Testing)'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={testPrintLoading}
                  onClick={handleTestPrint}
                  className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {testPrintLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : testPrintSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{testPrintSuccess ? 'Terkirim!' : 'Cetak Uji Coba'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 font-semibold text-xs rounded-xl transition-colors"
                >
                  {language === 'id' ? 'Putuskan Sambungan' : 'Disconnect'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info footer */}
        <p className="text-[11px] text-slate-500 leading-relaxed text-center">
          {language === 'id'
            ? 'Mendukung semua printer thermal mobile Bluetooth portabel 58mm/80mm dengan protokol ESC/POS (Epson, GOOJPRT, Xprinter, MPT-II, RPP02N, Zjiang).'
            : 'Compatible with all 58mm/80mm Bluetooth mobile thermal receipt printers using ESC/POS.'}
        </p>
      </div>
    </div>
  );
};
