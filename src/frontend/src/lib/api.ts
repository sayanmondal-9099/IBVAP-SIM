/**
 * Central API Client for IBVAP-SIM / KAAL
 *
 * Lightweight HTTP client built on browser native `fetch`.
 * Automatically prefixes requests with the configured API_BASE_URL.
 * Preserves standard { data, status } response contracts and error behaviors.
 */

import { API_BASE_URL } from "./config";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export class ApiError extends Error {
  status: number;
  data: any;
  response: {
    status: number;
    data: any;
  };

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.response = {
      status,
      data,
    };
  }
}

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

async function request<T = any>(
  endpoint: string,
  method: string,
  body?: any,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);

  const headers: Record<string, string> = {
    ...options.headers,
  };

  let serializedBody: BodyInit | null | undefined = undefined;

  if (body !== undefined && body !== null) {
    if (typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      serializedBody = JSON.stringify(body);
    } else {
      serializedBody = body as BodyInit;
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body: serializedBody,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorDetail =
      data && typeof data === "object" && data.detail
        ? String(data.detail)
        : `HTTP ${response.status} ${response.statusText}`;
    throw new ApiError(errorDetail, response.status, data);
  }

  return {
    data: data as T,
    status: response.status,
    headers: response.headers,
  };
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, "GET", undefined, options),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, "POST", body, options),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, "PATCH", body, options),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, "DELETE", undefined, options),
};

export default api;
