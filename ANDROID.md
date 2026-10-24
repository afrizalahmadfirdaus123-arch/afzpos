# AfzPOS untuk Android (Capacitor)

## Cara A: Build lewat GitHub (tanpa Android Studio)
1. Upload project ini ke repository GitHub (branch `main`).
2. Buka tab **Actions** > **Build APK** > **Run workflow**.
3. Setelah selesai, unduh artifact **afzpos-debug-apk**, ekstrak, lalu instal `app-debug.apk` di HP.

## Cara B: Build di komputer
Butuh Node.js LTS, JDK 21, dan Android Studio.

```bash
npm install
npm run build
npx cap add android        # sekali saja
npm run android:sync
npm run android:open       # buka di Android Studio, lalu Build > Build APK(s)
```

Setiap kali kode berubah: jalankan `npm run android:sync` lagi.

APK debug cukup untuk uji coba di HP. Untuk Play Store perlu build release yang ditandatangani (keystore).

## Catatan fitur di aplikasi Android
- **Printer thermal:** pakai printer yang mendukung Bluetooth Low Energy (BLE). Printer yang hanya Bluetooth klasik (SPP) tidak akan muncul. Saat pertama kali menghubungkan, izinkan akses Bluetooth/perangkat sekitar.
- **Cetak struk dan laporan:** tombol Cetak mengirim ke printer Bluetooth yang terhubung. Jika belum terhubung, laporan dibagikan sebagai teks lewat menu Bagikan.
- **Ekspor CSV dan backup:** file dibuat lalu dibuka lewat menu Bagikan (simpan ke Drive, kirim lewat WhatsApp, dll).
- **Kecepatan cetak:** atur `NATIVE_CHUNK_SIZE` dan `NATIVE_CHUNK_DELAY_MS` di `src/utils/bluetoothPrinter.ts` jika printermu stabil dengan paket lebih besar.
