import { useState, useMemo } from "react";
import { useSimulationContext } from "../contexts/SimulationContext";
import type { Observation } from "../hooks/useSimulationSocket";
import type { Sensor } from "../hooks/useEnvironmentPoll";
import { 
  Camera, 
  ScanEye, 
  Zap, 
  Maximize2, 
  X, 
  Flame, 
  Crosshair, 
  ZoomIn, 
  ZoomOut,
  Radio,
  Eye,
  Activity
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";

interface CameraConfig {
  id: string;
  name: string;
  sector: string;
  sensorType: "camera" | "thermal";
  azimuth: number;
  fov: number;
  range: number;
  status: "online" | "offline" | "degraded" | "calibrating";
}

const DEFAULT_CAMERAS: CameraConfig[] = [
  { id: "cam_01", name: "OPTICAL-01", sector: "SECTOR ALPHA (NORTH)", sensorType: "camera", azimuth: 270, fov: 160, range: 250, status: "online" },
  { id: "cam_02", name: "THERMAL-02", sector: "SECTOR BRAVO (NORTH-WEST)", sensorType: "thermal", azimuth: 270, fov: 160, range: 250, status: "online" },
  { id: "cam_03", name: "OPTICAL-03", sector: "SECTOR CHARLIE (CENTRAL)", sensorType: "camera", azimuth: 270, fov: 160, range: 250, status: "online" },
  { id: "cam_04", name: "THERMAL-04", sector: "SECTOR DELTA (SOUTH-WEST)", sensorType: "thermal", azimuth: 270, fov: 160, range: 250, status: "online" },
  { id: "cam_05", name: "OPTICAL-05", sector: "SECTOR ECHO (SOUTH)", sensorType: "camera", azimuth: 270, fov: 160, range: 250, status: "online" },
];

export default function Cameras() {
  const { observations, environment } = useSimulationContext();

  const [activeFilter, setActiveFilter] = useState<"ALL" | "OPTICAL" | "THERMAL">("ALL");
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({
    cam_01: 1.0,
    cam_02: 1.0,
    cam_03: 1.0,
    cam_04: 1.0,
    cam_05: 1.0,
  });
  const [thermalModes, setThermalModes] = useState<Record<string, boolean>>({
    cam_01: false,
    cam_02: true,
    cam_03: false,
    cam_04: true,
    cam_05: false,
  });
  const [selectedModalCam, setSelectedModalCam] = useState<CameraConfig | null>(null);

  // Merge real sensors from environment poll with default camera configurations (displaying all available cameras)
  const cameras: CameraConfig[] = useMemo(() => {
    const envCameras = (environment?.sensors || []).filter((s: Sensor) => s.sensor_type === "camera");
    if (envCameras.length > 0) {
      return envCameras.map((s, idx) => {
        const isThermalDefault = idx % 2 === 1;
        const defaultCam = DEFAULT_CAMERAS[idx] || {
          id: s.id,
          name: `OPTICAL-${String(idx + 1).padStart(2, "0")}`,
          sector: `SECTOR ${String.fromCharCode(65 + idx)}`,
          sensorType: isThermalDefault ? "thermal" : "camera",
          azimuth: 270,
          fov: 160,
          range: 250,
          status: "online",
        };
        return {
          id: s.id,
          name: defaultCam.name,
          sector: defaultCam.sector,
          sensorType: isThermalDefault ? "thermal" : "camera",
          azimuth: Math.round(s.orientation || 270),
          fov: Math.round(s.fov || 160),
          range: Math.round(s.range || 250),
          status: s.status === "online" ? "online" : s.status === "degraded" ? "degraded" : "offline",
        };
      });
    }
    return DEFAULT_CAMERAS;
  }, [environment?.sensors]);

  const filteredCameras = useMemo(() => {
    if (activeFilter === "OPTICAL") {
      return cameras.filter((c) => !thermalModes[c.id]);
    }
    if (activeFilter === "THERMAL") {
      return cameras.filter((c) => thermalModes[c.id]);
    }
    return cameras;
  }, [cameras, activeFilter, thermalModes]);

  const handleZoomIn = (camId: string) => {
    setZoomLevels((prev) => {
      const current = prev[camId] || 1.0;
      let next = current;
      if (current < 1.5) next = 1.5;
      else if (current < 2.0) next = 2.0;
      else if (current < 4.0) next = 4.0;
      return { ...prev, [camId]: next };
    });
  };

  const handleZoomOut = (camId: string) => {
    setZoomLevels((prev) => {
      const current = prev[camId] || 1.0;
      let next = current;
      if (current > 2.0) next = 2.0;
      else if (current > 1.5) next = 1.5;
      else if (current > 1.0) next = 1.0;
      return { ...prev, [camId]: next };
    });
  };

  const toggleThermal = (camId: string) => {
    setThermalModes((prev) => ({
      ...prev,
      [camId]: !prev[camId],
    }));
  };

  // Check if target position is within this camera's active coverage
  const isObsInCoverage = (x: number, y: number, cam: CameraConfig) => {
    const matched = (environment?.sensors || []).find((s) => s.id === cam.id);
    const sx = matched?.x ?? 0;
    const sy = matched?.y ?? (
      cam.id === "cam_01" ? 400 : cam.id === "cam_02" ? 200 : cam.id === "cam_03" ? 0 : cam.id === "cam_04" ? -200 : -400
    );
    const range = cam.range || 250;
    const fov = cam.fov || 160;
    const orientation = cam.azimuth || 270;

    const dx = x - sx;
    const dy = y - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) return false;

    let angleToObj = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (angleToObj < 0) angleToObj += 360;
    let diff = Math.abs(angleToObj - orientation);
    if (diff > 180) diff = 360 - diff;
    return diff <= fov / 2;
  };

  // Calculate real-time perspective position for in-feed detection overlay
  const getObsFeedPos = (obs: Observation, cam: CameraConfig) => {
    const matched = (environment?.sensors || []).find((s) => s.id === cam.id);
    const sx = matched?.x ?? 0;
    const sy = matched?.y ?? (
      cam.id === "cam_01" ? 400 : cam.id === "cam_02" ? 200 : cam.id === "cam_03" ? 0 : cam.id === "cam_04" ? -200 : -400
    );
    const orientation = cam.azimuth || 270;
    const fov = cam.fov || 160;
    const range = cam.range || 250;

    const dx = obs.x - sx;
    const dy = obs.y - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Angle offset relative to camera optical bore-sight
    let angleToObj = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (angleToObj < 0) angleToObj += 360;
    let angleDiff = angleToObj - orientation;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    // Map angle offset to horizontal percentage across camera viewport (14% to 86%)
    const normalizedAngle = angleDiff / (fov / 2); // -1.0 to +1.0
    const xPct = Math.max(14, Math.min(86, 50 + normalizedAngle * 36));

    // Map distance to perspective depth (closer = lower, further = higher near horizon)
    const distRatio = Math.max(0, Math.min(1, dist / range));
    const yPct = Math.max(28, Math.min(74, 74 - distRatio * 42));

    return { xPct, yPct, dist: Math.round(dist) };
  };

  // 4.4: Deduplicate detections observed by this camera (sensor-direct or in coverage)
  const getCameraDetections = (cam: CameraConfig): Observation[] => {
    const map = new Map<string, Observation>();
    for (const o of observations) {
      if (o.sensor_id === cam.id || (o.sensor_type === "fused" && isObsInCoverage(o.x, o.y, cam))) {
        if (!map.has(o.object_id) || o.sensor_id === cam.id) {
          map.set(o.object_id, o);
        }
      }
    }
    return Array.from(map.values());
  };

  const activeDetectionCount = observations.length;

  return (
    <div className="p-3 sm:p-4 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-2.5 overflow-y-auto font-mono-code custom-scrollbar">
      {/* Top Sensor Matrix Stats (Compact ~44px row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-[#0D171C] border border-[#192830] rounded-lg p-2 px-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[9px] text-[#758890] uppercase tracking-wider font-bold">OPTICAL NODES</div>
            <div className="text-sm sm:text-base font-bold text-[#E8F1F4] leading-tight">
              {cameras.filter((c) => c.status === "online").length} / {cameras.length} ONLINE
            </div>
          </div>
          <Camera className="w-4 h-4 text-[#48D3D2]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-lg p-2 px-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[9px] text-[#758890] uppercase tracking-wider font-bold">EDGE DETECTIONS</div>
            <div className="text-sm sm:text-base font-bold text-[#F4B65A] leading-tight">{activeDetectionCount} ACTIVE</div>
          </div>
          <Zap className="w-4 h-4 text-[#F4B65A]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-lg p-2 px-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[9px] text-[#758890] uppercase tracking-wider font-bold">STREAM FIDELITY</div>
            <div className="text-sm sm:text-base font-bold text-[#6ED694] leading-tight">1080P · 60 FPS</div>
          </div>
          <Activity className="w-4 h-4 text-[#6ED694]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-lg p-2 px-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[9px] text-[#758890] uppercase tracking-wider font-bold">ANALYTICS ENGINE</div>
            <div className="text-sm sm:text-base font-bold text-[#AD91FF] leading-tight">YOLOv8 + FLIR</div>
          </div>
          <ScanEye className="w-4 h-4 text-[#AD91FF]" />
        </div>
      </div>

      {/* Main Sensor Feeds Grid Card */}
      <DashboardCard
        title="TACTICAL SENSOR MATRIX // ELECTRO-OPTICAL & THERMAL FEEDS"
        subtitle="Simulated edge analytics viewports · Synthetic multi-spectrum border surveillance"
        icon={<ScanEye className="w-4 h-4 text-[#48D3D2]" />}
        className="min-h-0 flex-1 flex flex-col"
        noPadding
        contentClassName="p-2 sm:p-2.5 flex-1 min-h-0 flex flex-col overflow-hidden"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center bg-[#101E24] p-0.5 rounded-lg border border-[#192830]">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  activeFilter === "ALL"
                    ? "bg-[#48D3D2]/20 text-[#48D3D2] border border-[#48D3D2]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                ALL ({cameras.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("OPTICAL")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  activeFilter === "OPTICAL"
                    ? "bg-[#48D3D2]/20 text-[#48D3D2] border border-[#48D3D2]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                OPTICAL
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("THERMAL")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  activeFilter === "THERMAL"
                    ? "bg-[#AD91FF]/20 text-[#AD91FF] border-[#AD91FF]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                THERMAL IR
              </button>
            </div>

            {/* Simulation Boundary Pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono-code text-[9px] font-bold text-[#758890] border border-[#192830] bg-[#071014] px-2.5 py-1 rounded-lg">
              <Radio className="w-3 h-3 text-[#F4B65A]" />
              SIMULATION ONLY
            </span>
          </div>
        }
      >
        {/* Camera Grid Viewports (4.1: Sized for optimal 2x2 visibility with zero scroll on 1080p) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 flex-1 min-h-0">
          {filteredCameras.map((cam) => {
            const isThermal = thermalModes[cam.id] ?? false;
            const currentZoom = zoomLevels[cam.id] || 1.0;

            // 4.4: Deduplicated real detections actively observed by this camera
            const camDetections = getCameraDetections(cam);

            return (
              <div
                key={cam.id}
                className="overflow-hidden border border-[#192830] hover:border-[#48D3D2]/40 bg-[#0D171C] rounded-xl flex flex-col transition-all duration-200 shadow-md min-h-0 h-full"
              >
                {/* Viewport Top Header */}
                <div className="bg-[#101E24] border-b border-[#192830] px-3 py-1.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cam.status === "online"
                          ? "bg-[#6ED694] shadow-[0_0_6px_#6ED694]"
                          : cam.status === "degraded"
                          ? "bg-[#F4B65A] shadow-[0_0_6px_#F4B65A]"
                          : "bg-[#F07576] shadow-[0_0_6px_#F07576]"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E8F1F4]">{cam.id.toUpperCase()}</span>
                        <span className="text-[10px] text-[#758890]">// {cam.sector}</span>
                      </div>
                      <div className="text-[9px] text-[#52676F]">
                        AZ {cam.azimuth}° · FOV {cam.fov}° · RANGE {cam.range}M
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cam.status === "degraded" && (
                      <StatusPill
                        label="DEGRADED"
                        variant="amber"
                        size="xs"
                      />
                    )}
                    <StatusPill
                      label={isThermal ? "FLIR THERMAL" : "EO OPTICAL"}
                      variant={isThermal ? "violet" : "cyan"}
                      size="xs"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedModalCam(cam)}
                      aria-label={`Expand ${cam.name} feed`}
                      className="p-1 rounded bg-[#071014] hover:bg-[#192830] text-[#758890] hover:text-[#48D3D2] border border-[#192830] transition-colors cursor-pointer"
                      title="Expand feed"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Viewport Canvas Stage */}
                <div className="relative w-full flex-1 min-h-[140px] bg-[#050B0E] overflow-hidden flex items-center justify-center">
                  {/* Scanline Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25 z-10"
                    style={{
                      backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)",
                      backgroundSize: "100% 4px",
                    }}
                  />

                  {/* 4.2 Scalable Feed Content Layer (Scales terrain & targets dynamically) */}
                  <div
                    className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
                    style={{ transform: `scale(${currentZoom})` }}
                  >
                    {/* Synthetic Background: Thermal vs Optical (4.3: Distinct rendering styles) */}
                    {isThermal ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0F051D] via-[#1E0933] to-[#0A101C] flex items-center justify-center">
                        {/* Thermal simulated terrain & heat clouds */}
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-600/30 via-purple-900/20 to-transparent" />
                        <div className="w-40 h-20 rounded-full bg-gradient-to-r from-purple-700 via-amber-500 to-red-500 blur-xl opacity-60 animate-pulse" />
                        <div className="absolute bottom-10 left-1/3 w-16 h-10 rounded-full bg-yellow-400 blur-md opacity-70" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-[#08151D] via-[#060E13] to-[#04080B]">
                        {/* Landscape Silhouette & Synthetic Border Grid */}
                        <svg className="w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 400 200">
                          <line x1="0" y1="140" x2="400" y2="140" stroke="#1E3842" strokeWidth="1" />
                          <path
                            d="M 0,140 L 60,120 L 140,135 L 220,110 L 300,128 L 400,118"
                            fill="none"
                            stroke="#25424D"
                            strokeWidth="1.2"
                          />
                          {/* Border Fence Virtual Tripwire */}
                          <line
                            x1="180"
                            y1="0"
                            x2="180"
                            y2="200"
                            stroke="#F4B65A"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        </svg>
                      </div>
                    )}

                    {/* 4.4: Dynamic Observation Bounding Boxes with Camera ID & Confidence */}
                    {camDetections.slice(0, 4).map((obs) => {
                      const pos = getObsFeedPos(obs, cam);
                      const confPct = Math.round((obs.confidence || 0.85) * 100);
                      return (
                        <div
                          key={`${cam.id}-${obs.object_id}`}
                          className="absolute z-20 pointer-events-none border border-[#F07576] bg-[#071014]/90 px-1.5 py-0.5 rounded text-[8px] font-mono-code text-[#F07576] shadow-[0_0_8px_rgba(240,117,118,0.5)] transition-all duration-150"
                          style={{
                            left: `${pos.xPct}%`,
                            top: `${pos.yPct}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div className="flex items-center gap-1 font-bold whitespace-nowrap">
                            <span className="bg-[#F07576] text-[#071014] px-1 py-0.2 rounded text-[7px] font-extrabold tracking-wider">
                              {cam.id.toUpperCase()}: {obs.object_type.toUpperCase()} {confPct}%
                            </span>
                            <span className="text-[#48D3D2]">#{obs.object_id}</span>
                          </div>
                          <div className="text-[7px] text-[#758890] flex items-center justify-between gap-1.5 mt-0.5">
                            <span>SPD {Math.round(obs.speed || 0)}m/s</span>
                            <span>DST {pos.dist}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 4.3: Center Reticle / Crosshair */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="relative w-16 h-16 border border-[#48D3D2]/30 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#48D3D2]" />
                      <div className="absolute top-0 w-[1px] h-2 bg-[#48D3D2]" />
                      <div className="absolute bottom-0 w-[1px] h-2 bg-[#48D3D2]" />
                      <div className="absolute left-0 w-2 h-[1px] bg-[#48D3D2]" />
                      <div className="absolute right-0 w-2 h-[1px] bg-[#48D3D2]" />
                    </div>
                  </div>

                  {/* OSD Overlay */}
                  <div className="absolute inset-2 pointer-events-none z-20 flex flex-col justify-between text-[9px]">
                    {/* Top OSD Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-[#071014]/85 px-2 py-0.5 rounded border border-[#192830]">
                        <span className="w-2 h-2 rounded-full bg-[#F07576] animate-ping" />
                        <span className="text-white font-bold tracking-wider">REC · LIVE</span>
                      </div>
                      <div className="bg-[#071014]/85 px-2 py-0.5 rounded border border-[#192830] text-[#758890] flex items-center gap-2">
                        <span>1080P60</span>
                        <span>4.4 MBPS</span>
                      </div>
                    </div>

                    {/* Bottom OSD Bar */}
                    <div className="flex items-end justify-between">
                      <div className="bg-[#071014]/85 px-2 py-1 rounded border border-[#192830] space-y-0.5 text-[#758890]">
                        <div className="text-[#48D3D2] font-bold">
                          TARGETS IN FOV: {camDetections.length}
                        </div>
                        <div>AZ: {cam.azimuth}° // EL: -2.4°</div>
                      </div>

                      <div className="bg-[#071014]/85 px-2 py-1 rounded border border-[#192830] text-right text-[#758890]">
                        <div className="text-[#E8F1F4] font-bold">ZOOM {currentZoom.toFixed(1)}X</div>
                        <div>{isThermal ? "MODE: FLIR MWIR" : "MODE: EO COLOR"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viewport Interactive Controls & Telemetry (4.2: Zoom In & Zoom Out Controls) */}
                <div className="px-3 py-1.5 bg-[#0D171C] border-t border-[#192830] flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    {/* 4.3: Thermal Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleThermal(cam.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        isThermal
                          ? "bg-[#AD91FF]/15 text-[#AD91FF] border-[#AD91FF]/40"
                          : "bg-[#101E24] text-[#758890] border-[#192830] hover:text-[#E8F1F4]"
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>{isThermal ? "FLIR ON" : "EO MODE"}</span>
                    </button>

                    {/* 4.2: Paired Zoom In & Zoom Out Controls */}
                    <div className="flex items-center bg-[#101E24] border border-[#192830] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleZoomOut(cam.id)}
                        disabled={currentZoom <= 1.0}
                        title="Zoom Out"
                        aria-label={`Zoom out ${cam.id}`}
                        className="p-1 rounded text-[#758890] hover:text-[#48D3D2] disabled:opacity-30 disabled:hover:text-[#758890] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] font-bold text-[#E8F1F4] px-1 min-w-[28px] text-center font-mono-code">
                        {currentZoom.toFixed(1)}X
                      </span>
                      <button
                        type="button"
                        onClick={() => handleZoomIn(cam.id)}
                        disabled={currentZoom >= 4.0}
                        title="Zoom In"
                        aria-label={`Zoom in ${cam.id}`}
                        className="p-1 rounded text-[#758890] hover:text-[#48D3D2] disabled:opacity-30 disabled:hover:text-[#758890] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#758890]">
                      {camDetections.length > 0 ? (
                        <span className="text-[#F07576] flex items-center gap-1 font-bold">
                          <Crosshair className="w-3 h-3 animate-pulse" />
                          <span>
                            {cam.id.toUpperCase()}: {camDetections[0].object_type.toUpperCase()} {Math.round((camDetections[0].confidence || 0.85) * 100)}%
                            {camDetections.length > 1 ? ` (+${camDetections.length - 1})` : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#6ED694] flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          CLEAR
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DashboardCard>

      {/* Floating Tactical Camera Modal */}
      {selectedModalCam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedModalCam(null)}
        >
          <div
            className="w-full max-w-3xl rounded-xl border border-[#192830] bg-[#071014] text-[#E8F1F4] shadow-2xl overflow-hidden flex flex-col font-mono-code"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 border-b border-[#192830] bg-[#0D171C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#48D3D2] animate-ping" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#E8F1F4] uppercase">
                      {selectedModalCam.id} · {selectedModalCam.name}
                    </span>
                    {selectedModalCam.status === "degraded" && (
                      <StatusPill
                        label="DEGRADED"
                        variant="amber"
                        size="xs"
                      />
                    )}
                    <StatusPill
                      label={thermalModes[selectedModalCam.id] ? "FLIR THERMAL" : "EO OPTICAL"}
                      variant={thermalModes[selectedModalCam.id] ? "violet" : "cyan"}
                      size="xs"
                    />
                  </div>
                  <p className="text-[10px] text-[#758890] mt-0.5">
                    {selectedModalCam.sector} · AZ {selectedModalCam.azimuth}° · FOV {selectedModalCam.fov}° · RANGE {selectedModalCam.range}M
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModalCam(null)}
                aria-label="Close"
                className="p-1.5 rounded-md text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal High-Res Canvas */}
            <div className="relative w-full h-80 sm:h-96 bg-[#050B0E] overflow-hidden flex items-center justify-center">
              {/* Scanlines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 z-10"
                style={{
                  backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
                  backgroundSize: "100% 4px",
                }}
              />

              {/* Scalable optical/thermal scene container (zooms into feed contents) */}
              <div
                className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
                style={{ transform: `scale(${zoomLevels[selectedModalCam.id] || 1.0})` }}
              >
                {thermalModes[selectedModalCam.id] ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#100720] via-[#200D35] to-[#0A1220] flex items-center justify-center">
                    <div className="w-48 h-24 rounded-full bg-gradient-to-r from-purple-600 via-amber-400 to-red-500 blur-xl opacity-70 animate-pulse" />
                    <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-yellow-300 blur-md opacity-80" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#08151D] via-[#050D11] to-[#04080B]">
                    <svg className="w-full h-full opacity-40">
                      <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#1E3842" strokeWidth="1.5" />
                      <path d="M 0,180 L 150,150 L 320,170 L 480,140 L 640,165" fill="none" stroke="#25424D" strokeWidth="1" />
                      <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#F4B65A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
                    </svg>
                  </div>
                )}

                {/* 4.4: Modal Target Overlays with Camera ID & Confidence */}
                {getCameraDetections(selectedModalCam)
                  .slice(0, 4)
                  .map((obs) => {
                    const pos = getObsFeedPos(obs, selectedModalCam);
                    const confPct = Math.round((obs.confidence || 0.85) * 100);
                    return (
                      <div
                        key={`${selectedModalCam.id}-${obs.object_id}`}
                        className="absolute z-20 pointer-events-none border border-[#F07576] bg-[#071014]/90 px-2 py-1 rounded text-[9px] font-mono-code text-[#F07576] shadow-[0_0_8px_rgba(240,117,118,0.5)] transition-all duration-150"
                        style={{
                          left: `${pos.xPct}%`,
                          top: `${pos.yPct}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="bg-[#F07576] text-[#071014] px-1.5 py-0.5 rounded text-[7.5px] font-extrabold tracking-wider">
                            {selectedModalCam.id.toUpperCase()}: {obs.object_type.toUpperCase()} {confPct}%
                          </span>
                          <span className="text-[#48D3D2]">#{obs.object_id}</span>
                        </div>
                        <div className="text-[8px] text-[#F4B65A] mt-0.5">
                          SPD {Math.round(obs.speed || 0)} m/s · DST {pos.dist}m · HEADING {Math.round(obs.heading || 0)}°
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 4.3: Target Reticle in Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative w-32 h-32 border border-[#48D3D2]/40 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#48D3D2]" />
                  <div className="absolute top-0 w-[1px] h-4 bg-[#48D3D2]" />
                  <div className="absolute bottom-0 w-[1px] h-4 bg-[#48D3D2]" />
                  <div className="absolute left-0 w-4 h-[1px] bg-[#48D3D2]" />
                  <div className="absolute right-0 w-4 h-[1px] bg-[#48D3D2]" />
                </div>
              </div>

              {/* Modal OSD */}
              <div className="absolute inset-4 pointer-events-none z-20 flex flex-col justify-between text-[10px] text-[#48D3D2]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-[#071014]/80 px-2.5 py-1 rounded border border-[#192830]">
                    <span className="w-2 h-2 rounded-full bg-[#F07576] animate-ping" />
                    <span className="text-white font-bold text-[10px]">REC · LIVE TACTICAL STREAM</span>
                  </div>
                  <span className="bg-[#071014]/80 px-2 py-1 rounded border border-[#192830] text-[10px] text-[#758890]">
                    FPS 60.0 · BITRATE 4.8 MBPS
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#758890] bg-[#071014]/80 p-2 rounded border border-[#192830]">
                  <span>ZOOM: {(zoomLevels[selectedModalCam.id] || 1.0).toFixed(1)}X</span>
                  <span>BEARING: {selectedModalCam.azimuth}°</span>
                  <span>SECTOR: {selectedModalCam.sector}</span>
                  <span>EDGE YOLOv8: ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-3.5 bg-[#0D171C] border-t border-[#192830] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleThermal(selectedModalCam.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    thermalModes[selectedModalCam.id]
                      ? "bg-[#AD91FF]/20 text-[#AD91FF] border-[#AD91FF]/40"
                      : "bg-[#101E24] text-[#758890] border-[#192830] hover:text-[#E8F1F4]"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{thermalModes[selectedModalCam.id] ? "FLIR ACTIVE" : "SWITCH TO THERMAL"}</span>
                </button>

                {/* Modal Zoom Controls */}
                <div className="flex items-center bg-[#101E24] border border-[#192830] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleZoomOut(selectedModalCam.id)}
                    disabled={(zoomLevels[selectedModalCam.id] || 1.0) <= 1.0}
                    title="Zoom Out"
                    aria-label="Zoom Out"
                    className="p-1.5 rounded text-[#758890] hover:text-[#48D3D2] disabled:opacity-30 disabled:hover:text-[#758890] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-[#E8F1F4] px-2 min-w-[36px] text-center font-mono-code">
                    {(zoomLevels[selectedModalCam.id] || 1.0).toFixed(1)}X
                  </span>
                  <button
                    type="button"
                    onClick={() => handleZoomIn(selectedModalCam.id)}
                    disabled={(zoomLevels[selectedModalCam.id] || 1.0) >= 4.0}
                    title="Zoom In"
                    aria-label="Zoom In"
                    className="p-1.5 rounded text-[#758890] hover:text-[#48D3D2] disabled:opacity-30 disabled:hover:text-[#758890] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModalCam(null)}
                className="px-4 py-1.5 rounded-lg bg-[#101E24] hover:bg-[#132128] text-[#E8F1F4] border border-[#192830] text-xs font-bold transition-colors cursor-pointer"
              >
                Close Viewport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
