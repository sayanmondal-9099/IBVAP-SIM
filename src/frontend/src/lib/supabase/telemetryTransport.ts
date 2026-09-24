/**
 * IBVAP-SIM Supabase Realtime Telemetry Broadcast Transport (Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Manages the single ephemeral broadcast channel 'simulation_telemetry'
 * for 4 Hz simulation updates.
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import type { TelemetryBroadcastPayload } from "../simulation/types";

export type TransportState = "disconnected" | "connecting" | "connected" | "degraded";

export interface TelemetryTransportListener {
  onTelemetry: (payload: TelemetryBroadcastPayload) => void;
  onStateChange?: (state: TransportState) => void;
}

export class SupabaseTelemetryTransport {
  private static instance: SupabaseTelemetryTransport | null = null;

  public channelName = "simulation_telemetry";
  public eventName = "telemetry";

  private channel: RealtimeChannel | null = null;
  private listeners: Set<TelemetryTransportListener> = new Set();
  private currentState: TransportState = "disconnected";
  private currentOwnerId: string | null = null;
  private activeSimulationId: string | null = null;
  private isSubscribing = false;

  private constructor() {}

  public static getInstance(): SupabaseTelemetryTransport {
    if (!SupabaseTelemetryTransport.instance) {
      SupabaseTelemetryTransport.instance = new SupabaseTelemetryTransport();
    }
    return SupabaseTelemetryTransport.instance;
  }

  public getState(): TransportState {
    return this.currentState;
  }

  public getOwnerId(): string | null {
    return this.currentOwnerId;
  }

  public setOwnerId(ownerId: string): void {
    this.currentOwnerId = ownerId;
  }

  public setSimulationId(simId: string): void {
    this.activeSimulationId = simId;
  }

  public addListener(listener: TelemetryTransportListener): () => void {
    this.listeners.add(listener);
    // Notify current state immediately
    if (listener.onStateChange) {
      listener.onStateChange(this.currentState);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: TransportState) {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.listeners.forEach((l) => {
      if (l.onStateChange) l.onStateChange(newState);
    });
  }

  /**
   * Subscribes to the single 'simulation_telemetry' broadcast channel.
   * Protects against duplicate channels and subscriptions.
   */
  public async connect(): Promise<boolean> {
    if (this.channel && (this.currentState === "connected" || this.isSubscribing)) {
      return true;
    }

    this.isSubscribing = true;
    this.setState("connecting");

    // Clean up existing channel if any
    if (this.channel) {
      try {
        await supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn("Cleanup warning on removeChannel:", e);
      }
      this.channel = null;
    }

    try {
      this.channel = supabase.channel(this.channelName, {
        config: {
          broadcast: {
            ack: false, // Low-latency 4 Hz UDP-style broadcast
            self: true, // Receive own broadcasts for unified handling
          },
        },
      });

      this.channel
        .on("broadcast", { event: this.eventName }, (envelope: any) => {
          this.handleIncomingBroadcast(envelope.payload);
        })
        .subscribe((status, err) => {
          this.isSubscribing = false;
          if (status === "SUBSCRIBED") {
            this.setState("connected");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`Supabase Realtime status ${status}:`, err);
            this.setState("degraded");
          } else if (status === "CLOSED") {
            this.setState("disconnected");
          }
        });

      return true;
    } catch (err) {
      console.error("Failed to connect Supabase Realtime Broadcast:", err);
      this.isSubscribing = false;
      this.setState("degraded");
      return false;
    }
  }

  /**
   * Broadcasts a telemetry tick to all connected dashboards.
   * Only publishes if this instance is the active simulation owner.
   */
  public broadcastTelemetry(payload: TelemetryBroadcastPayload): void {
    // Single publisher enforcement
    if (this.currentOwnerId && payload.owner_id && this.currentOwnerId !== payload.owner_id) {
      console.warn("Suppressed duplicate broadcast from non-owner:", payload.owner_id);
      return;
    }

    // Always dispatch locally to listeners first for zero-lag UI response
    this.notifyListeners(payload);

    // If connected to Supabase Realtime, broadcast over Phoenix channel
    if (this.channel && this.currentState === "connected") {
      this.channel
        .send({
          type: "broadcast",
          event: this.eventName,
          payload,
        })
        .catch((err) => {
          console.warn("Broadcast send warning:", err);
        });
    }
  }

  /**
   * Validates and routes an incoming broadcast payload.
   */
  private handleIncomingBroadcast(raw: any): void {
    if (!raw || typeof raw !== "object") return;

    // Validate payload shape
    if (
      !raw.simulation_id ||
      !Array.isArray(raw.tracks) ||
      !Array.isArray(raw.observations)
    ) {
      return;
    }

    // If we are actively simulating as the owner, ignore echoed broadcasts
    if (this.currentOwnerId && raw.owner_id === this.currentOwnerId) {
      return;
    }

    // If we have an active simulation running, ignore foreign sessions
    if (this.activeSimulationId && raw.simulation_id !== this.activeSimulationId) {
      return;
    }

    this.notifyListeners(raw as TelemetryBroadcastPayload);
  }

  private notifyListeners(payload: TelemetryBroadcastPayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener.onTelemetry(payload);
      } catch (err) {
        console.error("Error in telemetry listener:", err);
      }
    });
  }

  /**
   * Cleanly leaves and unsubscribes from the channel.
   */
  public async disconnect(): Promise<void> {
    if (this.channel) {
      try {
        await supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn("Error disconnecting channel:", e);
      }
      this.channel = null;
    }
    this.setState("disconnected");
  }
}

export const telemetryTransport = SupabaseTelemetryTransport.getInstance();
