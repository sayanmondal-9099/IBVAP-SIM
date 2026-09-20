import { useState, useEffect, useMemo, useRef } from "react";
import { useSimulationContext } from "../contexts/SimulationContext";
import { Radio, Crosshair, Target, ShieldAlert, Sparkles } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";
import { TacticalGlyph } from "../components/simulation/TacticalGlyph";
import { TrackMarkerBadge } from "../components/simulation/TrackMarkerBadge";

interface RadarDisplayTarget {
  object_id: string;
  object_type: string;
  x: number;
  y: number;
  speed: number;
  heading: number;
  confidence: number;
  altitude: number;
  is_stealth: boolean;
  detectedBy: {
    radar: boolean;
    camera: boolean;
    fused: boolean;
    pcl: boolean;
  };
}

// 5.2: Isolated lightweight Azimuth Ticker to eliminate 60 FPS re-render churn of parent component
function AzimuthTicker({ sweepDurationSec }: { sweepDurationSec: number }) {
  const [azimuth, setAzimuth] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const periodMs = sweepDurationSec * 1000;
    let lastUpdate = 0;

    const updateTicker = (now: number) => {
      // Throttle state update to ~15 Hz (every 66ms) to keep readout smooth with negligible CPU overhead
      if (now - lastUpdate > 66) {
        const elapsed = now - startTime;
        const deg = ((elapsed % periodMs) / periodMs) * 360;
        setAzimuth(deg);
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(updateTicker);
    };

    animationFrameId = requestAnimationFrame(updateTicker);
    return () => cancelAnimationFrame(animationFrameId);
  }, [sweepDurationSec]);

  return (
    <div className="bg-[#0D171C]/90 backdrop-blur-md border border-[#192830] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-2">
      <Crosshair className="w-3.5 h-3.5 text-[#48D3D2]" />
      <span className="text-[#758890]">AZM TICK:</span>
      <span className="text-[#48D3D2] font-bold min-w-[46px]">{azimuth.toFixed(1)}°</span>
    </div>
  );
}

// Standard military compass bearing: 000° North (+y), 090° East (+x), 180° South (-y), 270° West (-x)
const calculateAzimuth = (x: number, y: number): number => {
  let deg = (Math.atan2(x, y) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
};

export default function Radar() {
  const {
    observations,
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    newAlerts,
    speedMultiplier,
    simulationState,
    environment,
  } = useSimulationContext();

  const [rangeScale, setRangeScale] = useState<250 | 500 | 1000>(500);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  // 5.4: Fictional Anti-Stealth / Passive Coherent Location (PCL) Sub-Mode
  const [isAntiStealth, setIsAntiStealth] = useState<boolean>(false);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Dynamic sweep duration based on simulation speed (base 10s divided by multiplier)
  const sweepDurationSec = 10 / Math.max(1, speedMultiplier);

  // Auto-scroll selected return card into view in the telemetry deck
  useEffect(() => {
    if (selectedTrackId && cardRefs.current[selectedTrackId]) {
      cardRefs.current[selectedTrackId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedTrackId]);

  // Determine radar beam shader based on mode and scenario
  const beamClass = useMemo(() => {
    if (isAntiStealth) return "radar-sweep-beam-stealth";
    const sc = simulationState?.scenario || "";
    if (sc.includes("EMERGENCY")) return "radar-sweep-beam-emergency";
    if (sc.includes("DRONE")) return "radar-sweep-beam-drone";
    if (sc.includes("VEHICLE")) return "radar-sweep-beam-vehicle";
    return "radar-sweep-beam-cyan";
  }, [isAntiStealth, simulationState?.scenario]);

  // 5.3 & 5.4: Deduplicate targets across radar, cameras, and fused sensors (Purely cosmetic PCL mode)
  const displayTargets: RadarDisplayTarget[] = useMemo(() => {
    if (!simulationState?.is_running) {
      return [];
    }

    const cameras = (environment?.sensors || []).filter((s) => s.sensor_type === "camera");
    const isTargetInAnyCamera = (x: number, y: number): boolean => {
      return cameras.some((cam) => {
        const dx = x - (cam.x ?? 0);
        const dy = y - (cam.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > (cam.range || 250)) return false;
        let angle = (Math.atan2(dx, dy) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        let diff = Math.abs(angle - (cam.orientation || 270));
        if (diff > 180) diff = 360 - diff;
        return diff <= (cam.fov || 160) / 2;
      });
    };

    const targetMap = new Map<string, RadarDisplayTarget>();

    // 1. Ingest live observations
    observations.forEach((obs) => {
      const isCamera = obs.sensor_type === "camera" || isTargetInAnyCamera(obs.x, obs.y);
      const isRadar = obs.sensor_type === "radar";
      const isFused = obs.sensor_type === "fused";
      const isStealthObj =
        obs.object_type.toLowerCase().includes("stealth") ||
        obs.object_type.toLowerCase().includes("bogey") ||
        obs.object_id.toLowerCase().includes("stealth");

      const existing = targetMap.get(obs.object_id);
      if (existing) {
        if (isCamera) existing.detectedBy.camera = true;
        if (isRadar) existing.detectedBy.radar = true;
        if (isFused) existing.detectedBy.fused = true;
        if (obs.sensor_type === "fused" || obs.sensor_type === "radar") {
          existing.x = obs.x;
          existing.y = obs.y;
          existing.speed = obs.speed;
          existing.heading = obs.heading;
          existing.confidence = Math.max(existing.confidence, obs.confidence);
        }
      } else {
        targetMap.set(obs.object_id, {
          object_id: obs.object_id,
          object_type: obs.object_type,
          x: obs.x,
          y: obs.y,
          speed: obs.speed,
          heading: obs.heading,
          confidence: obs.confidence,
          altitude: obs.altitude,
          is_stealth: isStealthObj,
          detectedBy: {
            radar: isRadar,
            camera: isCamera,
            fused: isFused,
            pcl: isStealthObj,
          },
        });
      }
    });

    // 2. Ingest persistent tracks if observations have not arrived yet
    if (targetMap.size === 0 && tracks.length > 0) {
      tracks.forEach((tr) => {
        const isStealthObj =
          tr.object_type.toLowerCase().includes("stealth") ||
          tr.object_type.toLowerCase().includes("bogey") ||
          tr.id.toLowerCase().includes("stealth");
        targetMap.set(tr.id, {
          object_id: tr.id,
          object_type: tr.object_type,
          x: tr.x,
          y: tr.y,
          speed: tr.speed,
          heading: tr.heading,
          confidence: 0.95,
          altitude: tr.altitude,
          is_stealth: isStealthObj,
          detectedBy: {
            radar: true,
            camera: isTargetInAnyCamera(tr.x, tr.y),
            fused: true,
            pcl: isStealthObj,
          },
        });
      });
    }

    return Array.from(targetMap.values());
  }, [observations, tracks, simulationState?.is_running, environment?.sensors]);


  // Deterministic Radar Cross Section (RCS) calculation based on ID hash
  const getDeterministicRCS = (id: string, type: string, isStealth: boolean): string => {
    if (isStealth) return "-34.8 dBsm (VHF SCATTER)";
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const offset = (Math.abs(hash % 80) / 10).toFixed(1);
    const t = type.toLowerCase();
    if (t.includes("drone") || t.includes("aircraft") || t.includes("uav")) {
      return `-${(12 + parseFloat(offset)).toFixed(1)} dBsm`;
    }
    if (t.includes("vehicle") || t.includes("truck") || t.includes("tank")) {
      return `+${(10 + parseFloat(offset)).toFixed(1)} dBsm`;
    }
    if (t.includes("person")) {
      return `-${(18 + parseFloat(offset)).toFixed(1)} dBsm`;
    }
    return `-${(6 + parseFloat(offset)).toFixed(1)} dBsm`;
  };

  const getTypeVariant = (type: string, isStealth: boolean): "cyan" | "amber" | "violet" | "green" => {
    if (isStealth) return "amber";
    const t = type.toLowerCase();
    if (["drone", "helicopter", "aircraft", "unknown aerial object"].some((k) => t.includes(k))) {
      return "cyan";
    }
    if (["vehicle", "truck", "tank"].some((k) => t.includes(k))) {
      return "violet";
    }
    if (t.includes("person")) {
      return "green";
    }
    return "amber";
  };

  return (
    <div className="p-3 sm:p-5 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-4 overflow-hidden font-mono-code">
      <DashboardCard
        title={
          isAntiStealth
            ? "PCL-9 MULTI-STATIC PASSIVE COHERENT LOCATION"
            : "GSR-7 ACTIVE FMCW RADAR TELEMETRY"
        }
        subtitle={
          isAntiStealth
            ? "Bi-static anti-stealth VHF broadcast illumination · 88–108 MHz passive coherence"
            : "Dual-polarization multi-sector surveillance · 9.4 GHz X-Band"
        }
        icon={<Radio className="w-4 h-4 text-[#48D3D2]" />}
        className="flex-1 h-full min-h-0"
        noPadding
        contentClassName="p-0 overflow-hidden flex flex-col md:flex-row h-full"
        action={
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 5.4: Mode Selector: Active FMCW vs PCL Anti-Stealth */}
            <div className="flex bg-[#101E24] border border-[#192830] p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setIsAntiStealth(false)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  !isAntiStealth
                    ? "bg-[#48D3D2] text-[#071014] shadow-sm"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                ACTIVE FMCW
              </button>
              <button
                type="button"
                onClick={() => setIsAntiStealth(true)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isAntiStealth
                    ? "bg-[#F4B65A] text-[#071014] shadow-sm"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>PCL ANTI-STEALTH</span>
              </button>
            </div>

            {/* Range Scale Segmented Buttons */}
            <div className="flex bg-[#101E24] border border-[#192830] p-0.5 rounded-lg text-[10px]">
              {([250, 500, 1000] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setRangeScale(rng)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    rangeScale === rng
                      ? "bg-[#48D3D2] text-[#071014] shadow-sm"
                      : "text-[#758890] hover:text-[#E8F1F4]"
                  }`}
                >
                  {rng}m
                </button>
              ))}
            </div>

            {/* Mode Flavor Indicator */}
            {isAntiStealth ? (
              <div className="hidden sm:flex items-center gap-1.5 bg-[#101E24] border border-[#F4B65A]/40 px-2.5 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-[#F4B65A] shadow-[0_0_6px_#F4B65A] animate-ping" />
                <span className="text-[#F4B65A] font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  PCL BISTATIC
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-[#6ED694] shadow-[0_0_6px_#6ED694] animate-pulse" />
                <span className="text-[#6ED694] font-bold text-[10px] tracking-wider uppercase">
                  ACTIVE FMCW
                </span>
              </div>
            )}

            {/* Simulated Boundary Badge */}
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#AD91FF]/10 text-[#AD91FF] border border-[#AD91FF]/30 tracking-widest font-bold uppercase">
              SYNTHETIC RADAR
            </span>
          </div>
        }
      >
        {/* Left / Center: Interactive Tactical Radar Scope Stage (5.1: responsive clamp preventing overflow/clipping) */}
        <div
          onClick={() => {
            setSelectedTrackId(null);
            setHoveredTrackId(null);
          }}
          className="flex-1 relative flex items-center justify-center bg-[#071014] overflow-hidden p-3 sm:p-5 min-h-[300px] w-full h-full cursor-default"
        >
          {/* Subtle Radar Scanline Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#192830_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* HUD Top Left Telemetry Overlay (5.2 Isolated Ticker) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-1 text-[10px] pointer-events-none">
            <AzimuthTicker sweepDurationSec={sweepDurationSec} />
            <div className="text-[9px] text-[#52676F] pl-1">
              {isAntiStealth ? "BAND: VHF BISTATIC (88–108 MHz)" : "BAND: X-BAND (9.4 GHz) · PRF: 2400Hz"}
            </div>
          </div>

          {/* HUD Top Right Scale Overlay */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 text-right text-[10px] pointer-events-none">
            <div className="bg-[#0D171C]/90 backdrop-blur-md border border-[#192830] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-2">
              <span className="text-[#758890]">RANGE GATE:</span>
              <span className="text-[#E8F1F4] font-bold">{rangeScale} METERS</span>
            </div>
          </div>

          {/* 5.1: Main Circular Radar Scope — aspect-square with viewport clamp preventing clipping */}
          <div className="relative aspect-square w-[min(100%,calc(100vh-220px))] max-w-[480px] max-h-[480px] rounded-full border border-[#192830] bg-[#0A141A]/60 flex items-center justify-center shadow-[inset_0_0_60px_rgba(7,16,20,0.8)] overflow-hidden shrink-0">
            {/* 5.2 Concentric Range Rings (Diameter 96%, 72%, 48%, 24% matching 100%, 75%, 50%, 25% scale) */}
            <div className="absolute w-[96%] h-[96%] rounded-full border border-[#192830]/90" />
            <div className="absolute w-[72%] h-[72%] rounded-full border border-dashed border-[#192830]/70" />
            <div className="absolute w-[48%] h-[48%] rounded-full border border-[#192830]/80" />
            <div className="absolute w-[24%] h-[24%] rounded-full border border-dashed border-[#192830]/60" />

            {/* Range Ring Labels precisely aligned with circles */}
            <span className="absolute top-[2%] text-[9px] text-[#52676F] font-bold">
              {rangeScale}m
            </span>
            <span className="absolute top-[14%] text-[8px] text-[#52676F]">
              {Math.round(rangeScale * 0.75)}m
            </span>
            <span className="absolute top-[26%] text-[8px] text-[#52676F]">
              {Math.round(rangeScale * 0.5)}m
            </span>
            <span className="absolute top-[38%] text-[8px] text-[#52676F]">
              {Math.round(rangeScale * 0.25)}m
            </span>

            {/* Crosshairs & Angle Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Vertical Sightline (000° - 180°) */}
              <div className="w-[1px] h-full bg-[#192830]" />
              {/* Horizontal Sightline (090° - 270°) */}
              <div className="h-[1px] w-full bg-[#192830] absolute" />
              {/* Diagonal 45° Lines */}
              <div className="w-[1px] h-full bg-[#192830]/40 rotate-45 absolute" />
              <div className="w-[1px] h-full bg-[#192830]/40 -rotate-45 absolute" />
            </div>

            {/* Cardinal Markers */}
            <span className="absolute top-1 text-[10px] font-bold text-[#48D3D2]">000° N</span>
            <span className="absolute right-1 text-[10px] font-bold text-[#758890]">090° E</span>
            <span className="absolute bottom-1 text-[10px] font-bold text-[#758890]">180° S</span>
            <span className="absolute left-1 text-[10px] font-bold text-[#758890]">270° W</span>

            {/* 5.2: Smooth GPU Rotating Conic Gradient Radar Sweep Beam */}
            <div
              className={`absolute inset-0 rounded-full ${beamClass} pointer-events-none`}
              style={{
                animation: `radar-sweep ${sweepDurationSec}s linear infinite`,
                transformOrigin: "center center",
                willChange: "transform",
              }}
            />

            {/* Center Origin Hub */}
            <div className="w-3 h-3 rounded-full bg-[#48D3D2] shadow-[0_0_10px_#48D3D2] z-10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#071014]" />
            </div>

            {/* 5.2 & 5.3: Plotted Target Blips Layer with CSS position transition */}
            {displayTargets.map((target) => {
              const distance = Math.sqrt(target.x * target.x + target.y * target.y);
              // Normalize distance to percentage radius of circular scope (max radius 48% aligns with 96% diameter outer ring)
              const clampedDist = Math.min(distance, rangeScale);
              const radiusPercent = (clampedDist / rangeScale) * 48;
              const normDist = distance > 0 ? distance : 1;
              // Cartesian screen mapping: North is +y (upwards), East is +x (right)
              const blipX = 50 + (target.x / normDist) * radiusPercent;
              const blipY = 50 - (target.y / normDist) * radiusPercent;

              const isAlert = newAlerts.includes(target.object_id);
              const isSelected = selectedTrackId === target.object_id;
              const isHovered = hoveredTrackId === target.object_id;
              const isApproach = target.x >= -150 && target.x < 0;
              const isBreach = target.x >= 0;

              let blipColor = "#48D3D2"; // default cyan
              if (target.is_stealth) {
                blipColor = "#F4B65A"; // stealth amber
              } else {
                const t = target.object_type.toLowerCase();
                if (["drone", "helicopter", "aircraft", "unknown aerial object"].some((k) => t.includes(k))) {
                  blipColor = "#48D3D2";
                } else if (["vehicle", "truck", "tank"].some((k) => t.includes(k))) {
                  blipColor = "#AD91FF";
                } else if (t.includes("person")) {
                  blipColor = "#6ED694";
                }
              }
              if (isApproach) blipColor = "#F4B65A";
              if (isBreach || isAlert) blipColor = "#F07576";

              const azm = calculateAzimuth(target.x, target.y);

              return (
                <div
                  key={target.object_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTrackId(target.object_id === selectedTrackId ? null : target.object_id);
                  }}
                  onMouseEnter={() => setHoveredTrackId(target.object_id)}
                  onMouseLeave={() => setHoveredTrackId((cur) => (cur === target.object_id ? null : cur))}
                  style={{
                    left: `${blipX}%`,
                    top: `${blipY}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group pointer-events-auto transition-all duration-300 ease-linear"
                >
                  {/* Outer Threat Status Halo */}
                  {(isBreach || isAlert) && (
                    <div className="absolute -inset-2.5 rounded-full border border-[#F07576] animate-ping opacity-75 pointer-events-none" />
                  )}
                  {isApproach && !isBreach && !isAlert && (
                    <div className="absolute -inset-2 rounded-full border border-[#F4B65A]/80 animate-pulse pointer-events-none" />
                  )}

                  {/* Active Selected Reticle */}
                  {isSelected && (
                    <div className="absolute -inset-3 rounded-full border border-dashed border-[#48D3D2] animate-[spin_4s_linear_infinite] pointer-events-none" />
                  )}

                  {/* 5.3: Tactical Target Badge */}
                  <div className="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <TrackMarkerBadge
                      objectType={target.is_stealth ? "stealth" : target.object_type}
                      objectId={target.object_id}
                      size={20}
                      showLabel={false}
                      isAlert={isBreach || isAlert}
                      isSelected={isSelected}
                      className={`transition-transform ${
                        isSelected || isHovered ? "scale-125" : "group-hover:scale-110"
                      }`}
                    />
                  </div>

                  {/* 5.4: Target Blip Tag & Interactive Telemetry Hover/Selection Overlay */}
                  {!(isHovered || isSelected) ? (
                    <div className="absolute left-3.5 top-[-8px] pointer-events-none whitespace-nowrap bg-[#0D171C]/90 backdrop-blur-sm border border-[#192830] px-1.5 py-0.5 rounded text-[8px] opacity-85 group-hover:opacity-100 transition-opacity">
                      <span style={{ color: blipColor }} className="font-bold">
                        {target.object_id.substring(0, 10).toUpperCase()}
                      </span>
                      <span className="text-[#758890] ml-1">{Math.round(distance)}m</span>
                      {target.detectedBy.camera && (
                        <span className="text-[#6ED694] ml-1 text-[7px] font-bold">[CAM]</span>
                      )}
                      {target.is_stealth && (
                        <span className="text-[#F4B65A] ml-1 text-[7px] font-bold">[PCL]</span>
                      )}
                    </div>
                  ) : (
                    <div className="absolute left-4 -top-8 z-30 pointer-events-none whitespace-nowrap bg-[#071014]/95 backdrop-blur-md border border-[#48D3D2]/70 p-2 rounded-lg text-[9px] shadow-[0_0_16px_rgba(7,16,20,0.95)] animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-[#192830] font-bold">
                        <span style={{ color: blipColor }} className="uppercase">
                          #{target.object_id.toUpperCase()}
                        </span>
                        <span className="text-[#758890]">·</span>
                        <span className="text-[#E8F1F4]">{target.object_type.toUpperCase()}</span>
                        {(isBreach || isAlert) && (
                          <span className="bg-[#F07576] text-[#071014] text-[7px] px-1 py-0.2 rounded font-extrabold">
                            CRITICAL
                          </span>
                        )}
                        {isApproach && !isBreach && !isAlert && (
                          <span className="bg-[#F4B65A] text-[#071014] text-[7px] px-1 py-0.2 rounded font-extrabold">
                            APPROACH
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 mt-1 text-[8px]">
                        <div>
                          <span className="text-[#758890]">AZM: </span>
                          <span className="text-[#48D3D2] font-bold">{azm.toFixed(1)}°</span>
                        </div>
                        <div>
                          <span className="text-[#758890]">RNG: </span>
                          <span className="text-[#E8F1F4] font-bold">{Math.round(distance)}m</span>
                        </div>
                        <div>
                          <span className="text-[#758890]">SPD: </span>
                          <span className="text-[#E8F1F4] font-bold">{target.speed.toFixed(1)}m/s</span>
                        </div>
                        <div>
                          <span className="text-[#758890]">ALT: </span>
                          <span className="text-[#E8F1F4] font-bold">{Math.round(target.altitude || 0)}m</span>
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-[#192830] text-[7.5px] text-[#758890] flex items-center justify-between">
                        <span>
                          {target.detectedBy.fused
                            ? "FUSED: RADAR + OPTICAL"
                            : target.detectedBy.radar
                            ? "ACTIVE FMCW RETURN"
                            : target.is_stealth
                            ? "PCL BISTATIC COHERENCE"
                            : "OPTICAL TRACK"}
                        </span>
                        <span className="text-[#6ED694] font-bold">{Math.round(target.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Target Telemetry & Radar Return Cards Deck */}
        <div className="w-full md:w-[340px] lg:w-[380px] bg-[#0D171C] border-t md:border-t-0 md:border-l border-[#192830] flex flex-col overflow-hidden">
          {/* Deck Header */}
          <div className="p-3 border-b border-[#192830] bg-[#101E24] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#48D3D2]" />
              <span className="text-xs font-bold text-[#E8F1F4] uppercase tracking-wider">
                DETECTED RETURNS
              </span>
            </div>
            <span className="text-xs font-bold text-[#48D3D2] bg-[#48D3D2]/10 border border-[#48D3D2]/30 px-2 py-0.5 rounded">
              {displayTargets.length} ACTIVE
            </span>
          </div>

          {/* Return Cards Scroll Area */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
            {displayTargets.length === 0 ? (
              <div className="p-8 text-center text-[#758890] text-xs uppercase tracking-wider">
                No active radar returns in sector
              </div>
            ) : (
              displayTargets.map((target) => {
                const distance = Math.round(Math.sqrt(target.x * target.x + target.y * target.y));
                const azimuth = calculateAzimuth(target.x, target.y);
                const isSelected = selectedTrackId === target.object_id;
                const isHovered = hoveredTrackId === target.object_id;
                const isAlert = newAlerts.includes(target.object_id);
                const isApproach = target.x >= -150 && target.x < 0;
                const isBreach = target.x >= 0;
                const rcs = getDeterministicRCS(target.object_id, target.object_type, target.is_stealth);

                return (
                  <div
                    key={target.object_id}
                    ref={(el) => {
                      cardRefs.current[target.object_id] = el;
                    }}
                    onClick={() => setSelectedTrackId(isSelected ? null : target.object_id)}
                    onMouseEnter={() => setHoveredTrackId(target.object_id)}
                    onMouseLeave={() => setHoveredTrackId((cur) => (cur === target.object_id ? null : cur))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected || isHovered
                        ? "bg-[#132128] border-[#48D3D2] shadow-[0_0_12px_rgba(72,211,210,0.15)]"
                        : "bg-[#101E24] border-[#192830] hover:border-[#48D3D2]/40 hover:bg-[#132128]"
                    }`}
                  >
                    {/* Top Row: Track ID + Classification StatusPill */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#192830] mb-2">
                      <div className="flex items-center gap-1.5">
                        <TacticalGlyph
                          objectType={target.is_stealth ? "stealth" : target.object_type}
                          objectId={target.object_id}
                          size={14}
                        />
                        <span className="text-xs font-bold text-[#E8F1F4]">
                          {target.object_id.toUpperCase()}
                        </span>
                        {(isBreach || isAlert) && (
                          <span className="w-2 h-2 rounded-full bg-[#F07576] shadow-[0_0_6px_#F07576] animate-ping" />
                        )}
                        {isApproach && !isBreach && !isAlert && (
                          <span className="w-2 h-2 rounded-full bg-[#F4B65A] shadow-[0_0_6px_#F4B65A] animate-pulse" />
                        )}
                        {target.is_stealth && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-[#F4B65A]/20 text-[#F4B65A] border border-[#F4B65A]/40 font-bold">
                            STEALTH
                          </span>
                        )}
                      </div>
                      <StatusPill
                        label={target.object_type.toUpperCase()}
                        variant={getTypeVariant(target.object_type, target.is_stealth)}
                        size="xs"
                      />
                    </div>

                    {/* 5.3: Sensor Provenance Badges (Radar, Camera, PCL) */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {target.detectedBy.camera && target.detectedBy.radar && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30 font-bold">
                          FUSED: RADAR + OPTICAL
                        </span>
                      )}
                      {target.detectedBy.camera && !target.detectedBy.radar && !target.is_stealth && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#6ED694]/10 text-[#6ED694] border border-[#6ED694]/30 font-bold">
                          OPTICAL SENSOR DETECTION
                        </span>
                      )}
                      {!target.detectedBy.camera && target.detectedBy.radar && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#AD91FF]/10 text-[#AD91FF] border border-[#AD91FF]/30 font-bold">
                          ACTIVE FMCW RETURN
                        </span>
                      )}
                      {target.is_stealth && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#F4B65A]/15 text-[#F4B65A] border border-[#F4B65A]/40 font-bold">
                          PCL BISTATIC COHERENCE
                        </span>
                      )}
                    </div>

                    {/* Telemetry Grid (5.4: Accurate Compass Azimuth & Range) */}
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-[#758890]">RANGE:</span>
                        <span className="text-[#E8F1F4] font-bold">{distance}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#758890]">AZIMUTH:</span>
                        <span className="text-[#E8F1F4] font-bold">{azimuth.toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#758890]">SPEED:</span>
                        <span className="text-[#E8F1F4] font-bold">
                          {target.speed.toFixed(1)} <span className="text-[#52676F]">m/s</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#758890]">RCS:</span>
                        <span className={target.is_stealth ? "text-[#F4B65A] font-bold" : "text-[#48D3D2] font-bold"}>
                          {rcs}
                        </span>
                      </div>
                    </div>

                    {/* Quality / Confidence Bar */}
                    <div className="mt-2.5 pt-2 border-t border-[#192830] flex items-center justify-between text-[9px]">
                      <span className="text-[#52676F] uppercase">
                        {target.is_stealth ? "BISTATIC COHERENCE" : "SIGNAL CONFIDENCE"}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-[#071014] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${target.is_stealth ? "bg-[#F4B65A]" : "bg-[#48D3D2]"}`}
                            style={{ width: `${Math.round(target.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-[#758890] font-bold">
                          {Math.round(target.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
