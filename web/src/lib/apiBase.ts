const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

function normalizeBase(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("//")) {
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
    return `${protocol}${value}`;
  }

  if (value.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${value}`;
    }
    return value;
  }

  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  return `${protocol}//${value}`;
}

export function getApiBase(): string {
  if (ENV_API_BASE) return normalizeBase(ENV_API_BASE);

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiProtocol = protocol === "https:" ? "https:" : "http:";
    return `${apiProtocol}//${hostname}:3100`;
  }

  return "http://localhost:3100";
}

export function buildApiUrl(path: string): string {
  return new URL(path, getApiBase()).toString();
}
