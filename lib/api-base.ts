const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function normalizeApiBase(raw?: string): string {
  const candidate = (raw || '').trim();

  if (!candidate) {
    return 'http://localhost:8000';
  }

  try {
    const url = new URL(candidate);

    if (url.protocol === 'http:' && !LOCAL_HOSTS.has(url.hostname)) {
      url.protocol = 'https:';
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return candidate.replace(/\/+$/, '');
  }
}

export function getApiBaseUrl(): string {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
}
