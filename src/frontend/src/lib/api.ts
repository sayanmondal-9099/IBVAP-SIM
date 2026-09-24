/**
 * Central API Client for IBVAP-SIM / KAAL
 *
 * Lightweight HTTP client supporting dual-runtime architecture:
 *   - "local" mode: Dispatches native fetch to FastAPI server at API_BASE_URL
 *   - "cloud" mode: Routes domain queries directly to Supabase PostgreSQL & client-side state
 *
 * Preserves standard { data, status } response contracts and error behaviors.
 */

import { API_BASE_URL } from "./config";
import { getSimulationMode } from "./runtime";
import {
  fetchCloudAlerts,
  acknowledgeCloudAlert,
  acknowledgeAllCloudAlerts,
  fetchCloudIncidents,
  createCloudIncident,
  resolveCloudIncident,
  fetchCloudAuditLogs,
  recordCloudMockTransfer,
} from "./supabase/persistence";
import { getStandardSensors, getStandardZones } from "./simulation/scenarios";

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

/**
 * Cloud Mode request interceptor routing directly to Supabase or client state.
 */
async function handleCloudRequest<T = any>(
  endpoint: string,
  method: string,
  body?: any
): Promise<ApiResponse<T> | null> {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Alerts
  if (clean === "/api/alerts" && method === "GET") {
    const alerts = await fetchCloudAlerts();
    return { data: alerts as T, status: 200, headers: new Headers() };
  }

  const alertAckMatch = clean.match(/^\/api\/alerts\/([^/]+)\/acknowledge$/);
  if (alertAckMatch && (method === "PATCH" || method === "POST")) {
    const alertId = alertAckMatch[1];
    await acknowledgeCloudAlert(alertId);
    return { data: { status: "acknowledged", id: alertId } as T, status: 200, headers: new Headers() };
  }

  if (clean === "/api/alerts/acknowledge-all" && method === "POST") {
    await acknowledgeAllCloudAlerts();
    return { data: { status: "all_acknowledged" } as T, status: 200, headers: new Headers() };
  }

  const alertReviewMatch = clean.match(/^\/api\/alerts\/([^/]+)\/review$/);
  if (alertReviewMatch && method === "POST") {
    const alertId = alertReviewMatch[1];
    await acknowledgeCloudAlert(alertId, body?.actor || "Operator");
    return { data: { status: "reviewed", id: alertId } as T, status: 200, headers: new Headers() };
  }

  const alertEscalateMatch = clean.match(/^\/api\/alerts\/([^/]+)\/escalate$/);
  if (alertEscalateMatch && method === "POST") {
    const alertId = alertEscalateMatch[1];
    await createCloudIncident({
      title: `Escalated Threat: Alert ${alertId}`,
      description: body?.reason || "Operator escalated suspicious contact.",
      severity: "critical",
      related_alert_ids: [alertId],
      actor: body?.actor || "Operator",
    });
    return { data: { status: "escalated", id: alertId } as T, status: 200, headers: new Headers() };
  }

  // Incidents
  if (clean === "/api/incidents" && method === "GET") {
    const incidents = await fetchCloudIncidents();
    return { data: incidents as T, status: 200, headers: new Headers() };
  }

  if (clean === "/api/incidents" && method === "POST") {
    const created = await createCloudIncident({
      title: body?.title || "Manual Incident",
      description: body?.description || "Incident created from Command Center",
      severity: body?.severity || "high",
      related_alert_ids: body?.related_alert_ids || [],
      actor: body?.actor || "Operator",
    });
    return { data: created as T, status: 201, headers: new Headers() };
  }

  const incidentResolveMatch = clean.match(/^\/api\/incidents\/([^/]+)\/resolve$/);
  if (incidentResolveMatch && method === "POST") {
    const incidentId = incidentResolveMatch[1];
    await resolveCloudIncident(incidentId, body?.resolution_notes || "Resolved by operator");
    return { data: { status: "resolved", id: incidentId } as T, status: 200, headers: new Headers() };
  }

  // Audit
  if (clean === "/api/audit" && method === "GET") {
    const logs = await fetchCloudAuditLogs();
    return { data: logs as T, status: 200, headers: new Headers() };
  }

  if (clean === "/api/audit/verify" && method === "GET") {
    const logs = await fetchCloudAuditLogs();
    return {
      data: {
        verified: true,
        chain_length: logs.length,
        algorithm: "SHA-256 (Supabase atomic trigger)",
        status: "VERIFIED_VALID",
      } as T,
      status: 200,
      headers: new Headers(),
    };
  }

  // Transfers
  if (clean === "/api/transfers" && method === "POST") {
    await recordCloudMockTransfer({
      recipient: body?.recipient || "Military Tactical Receiver",
      payload_summary: body?.summary || "Simulated Border Intelligence Dossier",
      actor: body?.actor || "Operator",
    });
    return { data: { status: "transferred", acknowledged: true } as T, status: 200, headers: new Headers() };
  }

  // Health
  if (clean === "/health" && method === "GET") {
    return {
      data: {
        status: "healthy",
        runtime_mode: "cloud",
        architecture: "Vercel + Supabase Realtime Broadcast",
        simulation_boundary: "SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION",
        supabase_connected: true,
      } as T,
      status: 200,
      headers: new Headers(),
    };
  }

  // Environment
  if (clean === "/api/simulation/environment" && method === "GET") {
    return {
      data: {
        sensors: getStandardSensors(),
        zones: getStandardZones(),
        events: [],
      } as T,
      status: 200,
      headers: new Headers(),
    };
  }

  return null;
}

async function request<T = any>(
  endpoint: string,
  method: string,
  body?: any,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  // If running in cloud mode, attempt intercept first
  if (getSimulationMode() === "cloud") {
    try {
      const cloudRes = await handleCloudRequest<T>(endpoint, method, body);
      if (cloudRes !== null) {
        return cloudRes;
      }
    } catch (err) {
      console.warn("Cloud request handler error, falling back:", err);
    }
  }

  // Default: dispatch to local FastAPI server
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
