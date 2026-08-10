export const DEFAULT_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxSo6VoTPGaNaolINc5wPEiV-UJUjKJX9VOcOuBhNqu4V4T8EOw5pRZ2cjt8J8wLt68/exec';

export function getConfiguredGasWebAppUrl(): string {
  try {
    const saved = localStorage.getItem('hsk_gas_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed?.sheetUrl === 'string') return parsed.sheetUrl.trim();
    }
  } catch (error) {
    console.warn('Failed to read GAS URL from localStorage', error);
  }

  return ((import.meta as any).env?.VITE_GAS_SHEET_URL as string)?.trim() || DEFAULT_GAS_WEB_APP_URL;
}
