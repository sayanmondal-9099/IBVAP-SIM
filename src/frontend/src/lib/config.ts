/**
 * Central Network Configuration for IBVAP-SIM / KAAL Frontend
 *
 * Provides normalized, environment-configurable API and WebSocket base URLs.
 * In development, falls back safely to the local FastAPI server (http://127.0.0.1:8000).
 * In production, reads VITE_API_URL and VITE_WS_URL from environment variables.
 */

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Resolves the HTTP/HTTPS API base URL.
 */
function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return normalizeUrl(envUrl);
  }
  return "http://127.0.0.1:8000";
}

/**
 * Resolves the WebSocket (WS/WSS) base URL.
 * Prioritizes VITE_WS_URL, otherwise derives from VITE_API_URL, or defaults to 127.0.0.1:8000.
 */
function resolveWsBaseUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs && typeof envWs === "string" && envWs.trim().length > 0) {
    return normalizeUrl(envWs);
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && typeof envApi === "string" && envApi.trim().length > 0) {
    const normalized = normalizeUrl(envApi);
    if (normalized.startsWith("https://")) {
      return normalized.replace(/^https:\/\//, "wss://");
    }
    if (normalized.startsWith("http://")) {
      return normalized.replace(/^http:\/\//, "ws://");
    }
  }

  return "ws://127.0.0.1:8000";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const WS_BASE_URL = resolveWsBaseUrl();
