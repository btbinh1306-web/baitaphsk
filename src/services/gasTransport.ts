/**
 * Route browser requests through the app server so mobile browsers do not
 * have to read Google Apps Script directly across origins.
 */
export const getGasRequestUrl = (rawUrl: string): string => {
  if (typeof window === 'undefined') return rawUrl;

  const proxyUrl = new URL('/api/gas', window.location.origin);
  proxyUrl.searchParams.set('target', rawUrl);
  return proxyUrl.toString();
};
