export const DEFAULT_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzxnRqH-ohgth045nhd-hogJ3JNrEsq2gDjw7TUgOQMh8WDiOVCknKLqDRW7nBUo1ap/exec';
const LEGACY_GAS_WEB_APP_URLS = new Set([
  'https://script.google.com/macros/s/AKfycbwLXgg53v_sOQH_Yhb74aUpTIVx0eOChGrPkuB4OsA-DhkJnm1K0s_uxf4eO6JXl65h/exec',
  'https://script.google.com/macros/s/AKfycbyaB0n2M2wstStKGHE7KH4MlvXhb6Z4bYggs952KXUw6VwtexlGm6358eDumo8wPPYp/exec'
]);

export function normalizeGasWebAppUrl(url: string): string {
  const trimmed = url.trim();
  const embeddedUrl = trimmed.match(
    /https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec\/?(?:\?[^\s)\]]*)?/i
  )?.[0];
  const normalized = embeddedUrl || trimmed;
  return normalized.replace(/\/+(?=\?|$)/, '');
}

function migrateGasWebAppUrl(url: string): string {
  const normalized = normalizeGasWebAppUrl(url);
  return LEGACY_GAS_WEB_APP_URLS.has(normalized) ? DEFAULT_GAS_WEB_APP_URL : normalized;
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
