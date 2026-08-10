/**
 * Utility to safely set item in localStorage without throwing QuotaExceededError.
 * It progressively prunes older items or strips heavy image data if localStorage is full.
 */
export function safeSetLocalStorage<T>(key: string, dataArray: T[], maxKeep = 25): void {
  let listToSave = [...dataArray];

  // Try saving original data
  try {
    localStorage.setItem(key, JSON.stringify(listToSave));
    return;
  } catch (err) {
    console.warn(`localStorage quota exceeded for key "${key}". Attempting cleanup...`, err);
  }

  // Step 1: Limit total array length to maxKeep (keep newest)
  if (listToSave.length > maxKeep) {
    listToSave = listToSave.slice(0, maxKeep);
    try {
      localStorage.setItem(key, JSON.stringify(listToSave));
      console.log(`Saved ${listToSave.length} items to ${key} after array trim.`);
      return;
    } catch (err) {
      // Continue to next step
    }
  }

  // Step 2: Progressively trim older items array size
  while (listToSave.length > 1) {
    listToSave = listToSave.slice(0, Math.max(1, Math.floor(listToSave.length * 0.7)));
    try {
      localStorage.setItem(key, JSON.stringify(listToSave));
      console.log(`Saved ${listToSave.length} items to ${key} after trimming.`);
      return;
    } catch (err) {
      // Continue loop
    }
  }

  // Step 3: If still full, strip heavy image payloads from older records
  try {
    const stripped = listToSave.map((item: any, idx) => {
      if (idx === 0) return item; // Keep newest item intact
      return {
        ...item,
        submissionImages: item.submissionImages ? ['[Đã nộp - Đã tối ưu bộ nhớ]'] : undefined,
        correctedImages: item.correctedImages ? ['[Đã chấm - Đã tối ưu bộ nhớ]'] : undefined,
        audios: undefined,
      };
    });
    localStorage.setItem(key, JSON.stringify(stripped));
    console.log(`Saved stripped record to ${key}.`);
  } catch (err) {
    console.error(`Final attempt to set item "${key}" in localStorage failed silently to prevent crash:`, err);
  }
}
