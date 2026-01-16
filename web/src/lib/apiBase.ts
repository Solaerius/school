const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getApiBase(): string {
  if (ENV_API_BASE) return ENV_API_BASE;

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiProtocol = protocol === "https:" ? "https:" : "http:";
    return `${apiProtocol}//${hostname}:3100`;
  }

  return "http://localhost:3100";
}
