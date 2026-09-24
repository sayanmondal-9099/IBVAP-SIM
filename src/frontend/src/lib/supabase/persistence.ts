/**
 * IBVAP-SIM Cloud Domain Persistence Adapter (Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Persists ONLY durable domain events to Supabase PostgreSQL using anon key.
 * Strictly aligned with Phase V6C database schema.
 * NEVER persists raw 4 Hz telemetry ticks.
 */

import { supabase } from "./client";
import type { GeneratedAlert } from "../simulation/types";

export interface DbAlert {
  id: string;
  object_id: string;
  object_type: string;
  alert_type: string;
  reason_code: string;
  priority_score: number;
  priority_band: string;
  confidence: number;
  quality: number;
  persistence_time: number;
  corroboration_count: number;
  simulated_time: number;
  is_synthetic: boolean;
  simulation_id?: string;
  scenario_id?: string;
  sensor_id?: string;
  site_id?: string;
  status: string;
  created_at: string;
}

export interface DbIncident {
  id: string;
  simulation_id?: string;
  alert_id: string;
  status: string;
  resolution?: string;
  resolution_notes?: string;
  reviewer_id?: string;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAuditRecord {
  id?: string;
  sequence_num?: number;
  simulation_id?: string;
  actor: string;
  action: string;
  resource: string;
  reason?: string;
  request_id?: string;
  outcome: string;
  previous_hash?: string;
  current_hash?: string;
  is_synthetic?: boolean;
  timestamp?: string;
}

export interface DbMockTransfer {
  id?: string;
  incident_id: string;
  simulated_receiver: string;
  request_id?: string;
  simulation_id?: string;
  acknowledgement_status: string;
  is_synthetic: boolean;
  timestamp?: string;
}

const persistedAlertIds = new Set<string>();

/**
 * Persists a newly generated simulation alert to Supabase.
 * Enforces is_synthetic = true.
 */
export async function persistCloudAlert(alert: GeneratedAlert): Promise<boolean> {
  if (persistedAlertIds.has(alert.id)) {
    return true;
  }

  try {
    const payload = {
      id: alert.id,
      object_id: alert.object_id,
      object_type: alert.object_type,
      alert_type: alert.alert_type,
      reason_code: alert.reason_code,
      priority_score: alert.priority_score,
      priority_band: alert.priority_band,
      confidence: alert.confidence,
      quality: alert.quality,
      persistence_time: alert.persistence_time,
      corroboration_count: alert.corroboration_count,
      simulated_time: alert.simulated_time,
      is_synthetic: true, // Non-negotiable safety flag
      simulation_id: alert.simulation_id || null,
      scenario_id: alert.scenario_id || null,
      sensor_id: alert.sensor_id || "sim_fused_01",
      site_id: alert.site_id || "site_alpha",
      status: alert.status || "new",
      created_at: alert.created_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("alerts").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Failed to persist alert to Supabase:", error.message);
      return false;
    }

    persistedAlertIds.add(alert.id);
    return true;
  } catch (err) {
    console.error("Error persisting alert to Supabase:", err);
    return false;
  }
}

/**
 * Fetches all alerts from Supabase ordered by simulated_time descending.
 */
export async function fetchCloudAlerts(): Promise<DbAlert[]> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("Failed to fetch alerts from Supabase:", error.message);
      return [];
    }

    return (data || []) as DbAlert[];
  } catch (err) {
    console.error("Error fetching alerts from Supabase:", err);
    return [];
  }
}

/**
 * Acknowledges an alert in Supabase.
 */
export async function acknowledgeCloudAlert(alertId: string, actor = "Operator"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("alerts")
      .update({ status: "acknowledged" })
      .eq("id", alertId);

    if (error) {
      console.warn("Failed to acknowledge alert in Supabase:", error.message);
      return false;
    }

    // Record audit event
    await recordCloudAudit({
      actor,
      action: "ALERT_ACKNOWLEDGED",
      resource: `alert:${alertId}`,
      details: { alert_id: alertId },
      outcome: "SUCCESS",
    });

    return true;
  } catch (err) {
    console.error("Error acknowledging alert in Supabase:", err);
    return false;
  }
}

/**
 * Bulk acknowledges all unacknowledged alerts.
 */
export async function acknowledgeAllCloudAlerts(actor = "Operator"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("alerts")
      .update({ status: "acknowledged" })
      .in("status", ["new", "unacknowledged"]);

    if (error) {
      console.warn("Failed to acknowledge all alerts in Supabase:", error.message);
      return false;
    }

    await recordCloudAudit({
      actor,
      action: "ALL_ALERTS_ACKNOWLEDGED",
      resource: "alerts",
      details: { scope: "bulk" },
      outcome: "SUCCESS",
    });

    return true;
  } catch (err) {
    console.error("Error bulk acknowledging alerts in Supabase:", err);
    return false;
  }
}

/**
 * Creates or updates an incident in Supabase.
 */
export async function createCloudIncident(params: {
  alert_id?: string;
  title?: string;
  description?: string;
  severity?: string;
  related_alert_ids?: string[];
  status?: string;
  resolution?: string;
  resolution_notes?: string;
  reviewer_id?: string;
  simulation_id?: string;
  actor?: string;
}): Promise<DbIncident | null> {
  try {
    // If no alert_id was passed, associate with latest alert
    let targetAlertId = params.alert_id;
    if (!targetAlertId) {
      const alerts = await fetchCloudAlerts();
      if (alerts.length > 0) {
        targetAlertId = alerts[0].id;
      }
    }

    if (!targetAlertId) {
      console.warn("Cannot create incident without an alert");
      return null;
    }

    const payload = {
      alert_id: targetAlertId,
      status: params.status || "open",
      resolution: params.resolution || null,
      resolution_notes: params.resolution_notes || null,
      reviewer_id: params.reviewer_id || params.actor || "Operator",
      simulation_id: params.simulation_id || null,
      is_synthetic: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("incidents")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn("Failed to create incident in Supabase:", error.message);
      return null;
    }

    await recordCloudAudit({
      actor: params.actor || "Operator",
      action: "INCIDENT_CREATED",
      resource: `incident:${data.id}`,
      details: { alert_id: targetAlertId, status: data.status },
      outcome: "SUCCESS",
    });

    return data as DbIncident;
  } catch (err) {
    console.error("Error creating incident in Supabase:", err);
    return null;
  }
}

/**
 * Resolves an incident in Supabase.
 */
export async function resolveCloudIncident(
  incidentId: string,
  resolutionNotes: string,
  actor = "Operator"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("incidents")
      .update({
        status: "resolved",
        resolution: "Operator Resolved",
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incidentId);

    if (error) {
      console.warn("Failed to resolve incident in Supabase:", error.message);
      return false;
    }

    await recordCloudAudit({
      actor,
      action: "INCIDENT_RESOLVED",
      resource: `incident:${incidentId}`,
      details: { resolution_notes: resolutionNotes },
      outcome: "SUCCESS",
    });

    return true;
  } catch (err) {
    console.error("Error resolving incident in Supabase:", err);
    return false;
  }
}

/**
 * Fetches all incidents from Supabase.
 */
export async function fetchCloudIncidents(): Promise<DbIncident[]> {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Failed to fetch incidents from Supabase:", error.message);
      return [];
    }

    return (data || []) as DbIncident[];
  } catch (err) {
    console.error("Error fetching incidents from Supabase:", err);
    return [];
  }
}

/**
 * Records an audit log entry in Supabase.
 * Trigger trg_audit_chain_insert handles previous_hash and current_hash calculation automatically.
 */
export async function recordCloudAudit(entry: {
  actor: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  outcome: string;
  simulation_id?: string;
}): Promise<boolean> {
  try {
    const reasonText = entry.details ? JSON.stringify(entry.details) : undefined;
    const { error } = await supabase.from("audit_logs").insert({
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource,
      reason: reasonText,
      outcome: entry.outcome,
      simulation_id: entry.simulation_id || null,
      is_synthetic: true, // Non-negotiable safety constraint
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.warn("Failed to record audit log in Supabase:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error recording audit log in Supabase:", err);
    return false;
  }
}

/**
 * Fetches audit log records from Supabase ordered by sequence_num.
 */
export async function fetchCloudAuditLogs(): Promise<DbAuditRecord[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("sequence_num", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("Failed to fetch audit logs from Supabase:", error.message);
      return [];
    }

    return (data || []) as DbAuditRecord[];
  } catch (err) {
    console.error("Error fetching audit logs from Supabase:", err);
    return [];
  }
}

/**
 * Records a mock transfer to Army/Base display in Supabase.
 */
export async function recordCloudMockTransfer(transfer: {
  incident_id?: string;
  recipient?: string;
  payload_summary?: string;
  actor?: string;
}): Promise<boolean> {
  try {
    // If no incident_id provided, pick latest incident
    let targetIncidentId = transfer.incident_id;
    if (!targetIncidentId) {
      const incidents = await fetchCloudIncidents();
      if (incidents.length > 0) {
        targetIncidentId = incidents[0].id;
      }
    }

    if (!targetIncidentId) {
      console.warn("Mock transfer requires an active incident");
      return false;
    }

    const { data, error } = await supabase
      .from("mock_transfers")
      .insert({
        incident_id: targetIncidentId,
        simulated_receiver: transfer.recipient || "Display/Audit Mock Receiver",
        request_id: `req-${Date.now()}`,
        acknowledgement_status: "acknowledged",
        is_synthetic: true,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("Failed to record mock transfer in Supabase:", error.message);
      return false;
    }

    await recordCloudAudit({
      actor: transfer.actor || "Operator",
      action: "MOCK_TRANSFER_DISPATCHED",
      resource: `mock_transfer:${data.id}`,
      details: { recipient: data.simulated_receiver, incident_id: targetIncidentId },
      outcome: "SUCCESS",
    });

    return true;
  } catch (err) {
    console.error("Error recording mock transfer in Supabase:", err);
    return false;
  }
}
