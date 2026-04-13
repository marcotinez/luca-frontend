const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', 'host.docker.internal']);

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }

  const [a, b] = [Number(match[1]), Number(match[2])];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isLocalLikeHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return LOCAL_HOSTS.has(normalized) || normalized.endsWith('.local') || isPrivateIpv4(normalized);
}

function normalizeApiBase(raw?: string): string {
  const candidate = (raw || '').trim();

  if (!candidate) {
    return 'http://localhost:8000';
  }

  try {
    const url = new URL(candidate);

    // Only upgrade to HTTPS when the app is served over HTTPS and the API host is not local-like.
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      url.protocol === 'http:' &&
      !isLocalLikeHost(url.hostname)
    ) {
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
