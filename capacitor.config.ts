import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afzpos.terminal',
  appName: 'AfzPOS',
  webDir: 'dist',
  backgroundColor: '#020617',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Mencari printer...',
        cancel: 'Batal',
        availableDevices: 'Perangkat tersedia',
        noDeviceFound: 'Printer tidak ditemukan',
      },
    },
  },
};

export default config;
