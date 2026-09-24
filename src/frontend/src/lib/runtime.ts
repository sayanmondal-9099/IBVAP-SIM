/**
 * IBVAP-SIM Runtime Mode Abstraction (Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Supports dual-runtime architecture:
 *   - "local": React -> FastAPI -> SQLite -> Native WebSocket
 *   - "cloud": React -> TypeScript Simulation Worker -> Supabase Realtime Broadcast -> Supabase PostgreSQL
 */

export type SimulationRuntimeMode = "local" | "cloud";

const STORAGE_KEY = "ibvap_simulation_mode";

function resolveInitialMode(): SimulationRuntimeMode {
  // Check explicit environment variable (e.g. on Vercel deployment)
  const envMode = (
    import.meta.env.VITE_SIMULATION_MODE ||
    import.meta.env.VITE_DEPLOY_MODE ||
    ""
  ).toLowerCase();

  if (envMode === "cloud") return "cloud";
  if (envMode === "local") return "local";

  // Check saved localStorage preference
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "cloud" || saved === "local") {
        return saved;
      }
    } catch {
      // ignore
    }
  }

  // Default to cloud mode for production / Vercel deployment, local mode for localhost development
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0";

    if (!isLocalhost || window.location.hostname.includes("vercel.app") || import.meta.env.PROD) {
      return "cloud";
    }
  }

  return "local";
}

let activeMode: SimulationRuntimeMode = resolveInitialMode();
const modeListeners = new Set<(mode: SimulationRuntimeMode) => void>();

export function getSimulationMode(): SimulationRuntimeMode {
  return activeMode;
}

export function setSimulationMode(mode: SimulationRuntimeMode): void {
  if (activeMode === mode) return;
  activeMode = mode;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }

  modeListeners.forEach((listener) => {
    try {
      listener(mode);
    } catch (err) {
      console.error("Error in simulation mode listener:", err);
    }
  });
}

export function onSimulationModeChange(listener: (mode: SimulationRuntimeMode) => void): () => void {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}
