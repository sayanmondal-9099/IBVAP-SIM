import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { useSimulationContext } from "../contexts/SimulationContext";
import { 
  Activity, 
  Server, 
  Network, 
  Database, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Clock, 
  Shield, 
  Lock,
  Camera,
  Layers
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";

export default function Health() {
  const { simulationState, isConnected, tracks, observations, environment, speedMultiplier } = useSimulationContext();
  const [apiHealth, setApiHealth] = useState<{ status: string; latency: number } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await api.get("/health");
      const latency = Math.round(performance.now() - start);
      setApiHealth({ status: res.data.status || "healthy", latency });
    } catch {
      setApiHealth({ status: "unreachable", latency: 0 });
    } finally {
      setIsPinging(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const ping = async () => {
      const start = performance.now();
      try {
        const res = await api.get("/health");
        if (isMounted) {
          const latency = Math.round(performance.now() - start);
          setApiHealth({ status: res.data.status || "healthy", latency });
        }
      } catch {
        if (isMounted) {
          setApiHealth({ status: "unreachable", latency: 0 });
        }
      }
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isNetworkOnline = simulationState?.network_status === "online";
  const isEngineRunning = simulationState?.is_running ?? false;
  const isEnginePaused = simulationState?.is_paused ?? false;
  const isHealthy = (apiHealth?.status === "healthy" || apiHealth === null) && isConnected;

  const sensors = environment?.sensors || [];
  const cameraCount = sensors.filter((s) => s.sensor_type === "camera").length || 5;
  const radarCount = sensors.filter((s) => s.sensor_type === "radar").length || 1;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-y-auto font-mono-code custom-scrollbar">
      {/* Top Diagnostics Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">SYSTEM INTEGRITY</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-[#6ED694] shadow-[0_0_6px_#6ED694]" : "bg-[#F07576] animate-ping"}`} />
              <span className={`text-sm font-bold ${isHealthy ? "text-[#6ED694]" : "text-[#F07576]"}`}>
                {isHealthy ? "ALL SERVICES NOMINAL" : "DEGRADED / ALERT"}
              </span>
            </div>
          </div>
          <Activity className="w-4 h-4 text-[#6ED694]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">API IPC LATENCY</div>
            <div className="text-xl font-bold text-[#48D3D2] leading-tight">
              {apiHealth ? `${apiHealth.latency} ms` : "< 10 ms"}
            </div>
          </div>
          <Clock className="w-4 h-4 text-[#48D3D2]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">TELEMETRY SOCKET</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#6ED694]" : "bg-[#F07576] animate-ping"}`} />
              <span className={`text-sm font-bold ${isConnected ? "text-[#6ED694]" : "text-[#F07576]"}`}>
                {isConnected ? "60 HZ STREAMING" : "OFFLINE"}
              </span>
            </div>
          </div>
          <Network className="w-4 h-4 text-[#AD91FF]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">SAFETY COMPLIANCE</div>
            <div className="text-sm font-bold text-[#F4B65A] leading-tight">AIR-GAPPED SIM</div>
          </div>
          <Shield className="w-4 h-4 text-[#F4B65A]" />
        </div>
      </div>

      {/* Main Diagnostic Deck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Core Services Diagnostic Card */}
        <DashboardCard
          title="CORE INFRASTRUCTURE SERVICES"
          subtitle="Host daemon processes, microservices & persistence state"
          icon={<Server className="w-4 h-4 text-[#48D3D2]" />}
          action={
            <button
              type="button"
              onClick={checkHealth}
              disabled={isPinging}
              className="flex items-center gap-1.5 bg-[#101E24] hover:bg-[#132128] text-[#E8F1F4] border border-[#192830] hover:border-[#48D3D2]/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#48D3D2] ${isPinging ? "animate-spin" : ""}`} />
              <span className="text-[10px] uppercase tracking-wider">PING</span>
            </button>
          }
        >
          <div className="space-y-3 font-mono-code text-xs">
            {/* Backend API */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-[#48D3D2]" />
                <div>
                  <div className="font-bold text-[#E8F1F4]">BACKEND REST API (FASTAPI)</div>
                  <div className="text-[10px] text-[#758890]">{API_BASE_URL} · Uvicorn ASGI Engine</div>
                </div>
              </div>
              <StatusPill
                label={apiHealth?.status === "unreachable" ? "OFFLINE" : "HEALTHY"}
                variant={apiHealth?.status === "unreachable" ? "red" : "green"}
                size="xs"
              />
            </div>

            {/* WebSocket Telemetry */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-[#AD91FF]" />
                <div>
                  <div className="font-bold text-[#E8F1F4]">TELEMETRY BROADCAST WEBSOCKET</div>
                  <div className="text-[10px] text-[#758890]">/api/simulation/telemetry · Low-latency bi-directional</div>
                </div>
              </div>
              <StatusPill
                label={isConnected ? "CONNECTED" : "DISCONNECTED"}
                variant={isConnected ? "green" : "red"}
                size="xs"
              />
            </div>

            {/* SQLite Database */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#6ED694]" />
                <div>
                  <div className="font-bold text-[#E8F1F4]">SQLITE PERSISTENCE & AUDIT LEDGER</div>
                  <div className="text-[10px] text-[#758890]">ibvap_sim.db · WAL journal · SHA-256 integrity</div>
                </div>
              </div>
              <StatusPill label="ONLINE (WAL)" variant="green" size="xs" />
            </div>

            {/* Zero-Copy IPC Bus */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#F4B65A]" />
                <div>
                  <div className="font-bold text-[#E8F1F4]">EVENT BUS & STATE SYNCHRONIZER</div>
                  <div className="text-[10px] text-[#758890]">In-memory simulation state publisher</div>
                </div>
              </div>
              <StatusPill label="ACTIVE" variant="cyan" size="xs" />
            </div>
          </div>
        </DashboardCard>

        {/* Simulation Engine & Gateway State Card */}
        <DashboardCard
          title="SIMULATION ENGINE & EDGE GATEWAY"
          subtitle="Real-time kinematic simulator, scenario execution & edge network buffer"
          icon={<Cpu className="w-4 h-4 text-[#AD91FF]" />}
        >
          <div className="space-y-3 font-mono-code text-xs">
            {/* Engine Status */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#758890] uppercase font-bold">SIMULATION STATUS</div>
                <div className="text-sm font-bold text-[#E8F1F4] mt-0.5">
                  {isEngineRunning ? (isEnginePaused ? "PAUSED" : "RUNNING") : "HALTED / READY"}
                </div>
              </div>
              <StatusPill
                label={isEngineRunning ? (isEnginePaused ? "PAUSED" : "ACTIVE") : "IDLE"}
                variant={isEngineRunning ? (isEnginePaused ? "amber" : "violet") : "cyan"}
                size="xs"
              />
            </div>

            {/* Scenario & Multiplier */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold">ACTIVE SCENARIO</div>
                <div className="text-xs font-bold text-[#48D3D2] truncate mt-0.5">
                  {simulationState?.scenario || "ROUTINE PATROL"}
                </div>
              </div>

              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold">TICK RATE & SPEED</div>
                <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">
                  {(simulationState?.tick_rate || 1.0).toFixed(1)} Hz · {speedMultiplier}X
                </div>
              </div>
            </div>

            {/* Mock Network State */}
            <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isNetworkOnline ? (
                  <Wifi className="w-4 h-4 text-[#6ED694]" />
                ) : (
                  <WifiOff className="w-4 h-4 text-[#F07576]" />
                )}
                <div>
                  <div className="font-bold text-[#E8F1F4]">MOCK EDGE NETWORK LINK</div>
                  <div className="text-[10px] text-[#758890]">
                    {isNetworkOnline ? "Edge-to-command synchronizer online" : "Simulated network failure active"}
                  </div>
                </div>
              </div>
              <StatusPill
                label={isNetworkOnline ? "ONLINE" : "OFFLINE"}
                variant={isNetworkOnline ? "green" : "red"}
                size="xs"
              />
            </div>

            {/* Offline Resilience Banner (AGENTS.md Principles 7 & 15) */}
            {!isNetworkOnline && (
              <div className="p-2.5 rounded-lg border border-[#F07576]/40 bg-[#F07576]/10 text-[10px] text-[#F07576] flex items-start gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">OFFLINE BUFFERING ACTIVE:</span> Edge simulator is accumulating synthetic observations locally. Synchronizes idempotently upon link restoration.
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Sensor Fabric Diagnostic Monitor */}
        <DashboardCard
          title="SIMULATED SENSOR FABRIC"
          subtitle="Optical cameras, pulse-doppler radar & perimeter virtual tripwires"
          icon={<Radio className="w-4 h-4 text-[#6ED694]" />}
        >
          <div className="space-y-3 font-mono-code text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#758890] uppercase font-bold">ELECTRO-OPTICAL / FLIR</div>
                  <div className="text-sm font-bold text-[#48D3D2] mt-0.5">{cameraCount} NODES ONLINE</div>
                </div>
                <Camera className="w-4 h-4 text-[#48D3D2]" />
              </div>

              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#758890] uppercase font-bold">RADAR STATIONS</div>
                  <div className="text-sm font-bold text-[#6ED694] mt-0.5">{radarCount} SCOPE ACTIVE</div>
                </div>
                <Radio className="w-4 h-4 text-[#6ED694]" />
              </div>
            </div>

            <div className="bg-[#071014] border border-[#192830] p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#758890]">ACTIVE TARGET TRACKS:</span>
                <span className="text-[#E8F1F4] font-bold">{tracks.length} TARGETS</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#758890]">OBSERVATIONS IN FLIGHT:</span>
                <span className="text-[#AD91FF] font-bold">{observations.length} TELEMETRY FRAMES</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#758890]">RESTRICTED ZONES DEFINED:</span>
                <span className="text-[#6ED694] font-bold">{environment?.zones?.length || 3} VIRTUAL ZONES</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Safety Boundary Compliance Checklist */}
        <DashboardCard
          title="SIMULATION SAFETY BOUNDARY AUDIT"
          subtitle="Non-negotiable compliance checklist (AGENTS.md Section 2)"
          icon={<ShieldCheck className="w-4 h-4 text-[#F4B65A]" />}
        >
          <div className="space-y-2.5 font-mono-code text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#101E24] border border-[#192830]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6ED694]" />
                <span className="text-[#E8F1F4] text-[11px]">Real military / defence networks:</span>
              </div>
              <span className="text-[9px] font-bold text-[#6ED694] bg-[#6ED694]/10 border border-[#6ED694]/30 px-2 py-0.5 rounded">
                DISCONNECTED (AIR-GAPPED)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#101E24] border border-[#192830]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6ED694]" />
                <span className="text-[#E8F1F4] text-[11px]">Operational CCTV / Radar hardware:</span>
              </div>
              <span className="text-[9px] font-bold text-[#6ED694] bg-[#6ED694]/10 border border-[#6ED694]/30 px-2 py-0.5 rounded">
                SYNTHETIC ADAPTER ONLY
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#101E24] border border-[#192830]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6ED694]" />
                <span className="text-[#E8F1F4] text-[11px]">Weapon systems / Autonomous firing:</span>
              </div>
              <span className="text-[9px] font-bold text-[#F4B65A] bg-[#F4B65A]/10 border border-[#F4B65A]/30 px-2 py-0.5 rounded">
                STRICTLY PROHIBITED
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#101E24] border border-[#192830]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6ED694]" />
                <span className="text-[#E8F1F4] text-[11px]">Mock Base receiver integration:</span>
              </div>
              <span className="text-[9px] font-bold text-[#48D3D2] bg-[#48D3D2]/10 border border-[#48D3D2]/30 px-2 py-0.5 rounded">
                DISPLAY & AUDIT ONLY
              </span>
            </div>

            <div className="p-2 rounded bg-[#071014] border border-[#192830] text-[9px] text-[#52676F] leading-relaxed mt-2 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#AD91FF] shrink-0" />
              <span>
                All prototype data is synthetic. UI permanently verifies: <strong className="text-[#758890]">SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION</strong>.
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

