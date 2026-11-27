export const DEFAULT_LOG_LINES = 100;

// This browser-local preference is shared across Portainer accounts.
const STORAGE_KEY = 'docker-log-viewer-default-lines';

export function getDefaultLogLines(storage) {
  try {
    const value = storage.get(STORAGE_KEY);
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_LOG_LINES;
  } catch {
    return DEFAULT_LOG_LINES;
  }
}

export function saveDefaultLogLines(storage, value) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    return;
  }

  try {
    storage.set(STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}
