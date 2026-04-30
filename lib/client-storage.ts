const STORAGE_PREFIX = 'luca:';

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function resolveKey(key: string) {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

export function readStorage<T>(key: string, fallback: T, parser?: (value: unknown) => T): T {
  if (!isStorageAvailable()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(resolveKey(key));
    if (raw === null) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as unknown;
    return parser ? parser(parsed) : (parsed as T);
  } catch {
    window.localStorage.removeItem(resolveKey(key));
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(resolveKey(key), JSON.stringify(value));
}

export function removeStorage(key: string) {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(resolveKey(key));
}

export function clearStorageNamespace(keys: string[]) {
  if (!isStorageAvailable()) {
    return;
  }

  for (const key of keys) {
    window.localStorage.removeItem(resolveKey(key));
  }
}

export function getStorageKey(key: string) {
  return resolveKey(key);
}

export function readStringStorage(key: string) {
  return readStorage<string | null>(key, null, (value) => (typeof value === 'string' ? value : null));
}
