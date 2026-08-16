export const DEFAULT_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzxnRqH-ohgth045nhd-hogJ3JNrEsq2gDjw7TUgOQMh8WDiOVCknKLqDRW7nBUo1ap/exec';
const LEGACY_GAS_WEB_APP_URLS = new Set([
  'https://script.google.com/macros/s/AKfycbwLXgg53v_sOQH_Yhb74aUpTIVx0eOChGrPkuB4OsA-DhkJnm1K0s_uxf4eO6JXl65h/exec',
  'https://script.google.com/macros/s/AKfycbyaB0n2M2wstStKGHE7KH4MlvXhb6Z4bYggs952KXUw6VwtexlGm6358eDumo8wPPYp/exec'
]);

function migrateGasWebAppUrl(url: string): string {
  return LEGACY_GAS_WEB_APP_URLS.has(url) ? DEFAULT_GAS_WEB_APP_URL : url;
}

export function getConfiguredGasWebAppUrl(): string {
  try {
    const saved = localStorage.getItem('hsk_gas_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed?.sheetUrl === 'string' && parsed.sheetUrl.trim()) {
        return migrateGasWebAppUrl(parsed.sheetUrl.trim());
      }
    }
  } catch (error) {
    console.warn('Failed to read GAS URL from localStorage', error);
  }

  const envUrl = ((import.meta as any).env?.VITE_GAS_SHEET_URL as string)?.trim() || '';
  return migrateGasWebAppUrl(envUrl) || DEFAULT_GAS_WEB_APP_URL;
}
