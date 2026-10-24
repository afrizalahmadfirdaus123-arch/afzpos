/**
 * Jembatan antara kode web dan fitur native Android (Capacitor).
 * Di browser biasa, semua fungsi di sini jatuh ke perilaku web standar.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AppLauncher } from '@capacitor/app-launcher';

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

const isCancel = (err: unknown): boolean =>
  /cancel/i.test(err instanceof Error ? err.message : String(err));

/**
 * Buka URL di luar aplikasi (mis. WhatsApp).
 * Native: lewat intent Android, sehingga wa.me langsung membuka aplikasi WhatsApp.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    try {
      await AppLauncher.openUrl({ url });
      return;
    } catch (err) {
      console.warn('AppLauncher gagal, memakai fallback:', err);
    }
  }

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  } catch (err) {
    console.warn('Gagal membuka link:', err);
  }
}

/**
 * Simpan file teks (CSV, JSON, dll).
 * Browser: unduh biasa. Android: tulis ke cache lalu buka menu Bagikan
 * (simpan ke Drive, kirim lewat WhatsApp, dsb).
 */
export async function saveTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8;'
): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const written = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: filename,
        dialogTitle: filename,
        files: [written.uri],
      });
      return true;
    } catch (err) {
      if (isCancel(err)) return false;
      console.error('Gagal menyimpan file:', err);
      window.alert('Gagal menyimpan file / Failed to save file');
      return false;
    }
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Bagikan teks lewat menu Bagikan Android (atau Web Share / salin di browser).
 */
export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      await Share.share({ title, text, dialogTitle: title });
      return true;
    }
    const nav: Navigator = navigator;
    if (typeof nav.share === 'function') {
      await nav.share({ title, text });
      return true;
    }
    await nav.clipboard.writeText(text);
    return true;
  } catch (err) {
    if (!isCancel(err)) {
      console.warn('Gagal membagikan teks:', err);
    }
    return false;
  }
}
