import { useState, useRef, useEffect, useMemo } from "react";
import { useSimulationContext } from "../contexts/SimulationContext";
import { SimulationControlBar } from "../components/simulation/SimulationControlBar";
import { EventTimeline } from "../components/simulation/EventTimeline";
import { LiveCounters } from "../components/simulation/LiveCounters";
import { ActiveAlertsPanel } from "../components/simulation/ActiveAlertsPanel";
import { RotatingCameraLayer } from "../components/simulation/RotatingCameraLayer";
import { useAudioAlarm } from "../hooks/useAudioAlarm";
import { Compass, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { getTacticalCategory, getTacticalColor } from "../lib/tactical";
import { TrackMarkerBadge } from "../components/simulation/TrackMarkerBadge";

// Coordinate system:
// Center is (0,0) in world, which maps to (500, 500) in SVG.
// World Y goes up, SVG Y goes down.
function worldToSvg(x: number, y: number) {
  return {
    sx: 500 + x,
    sy: 500 - y,
  };
}

export default function CommandMap() {
  const { 
    observations, 
    trackHistory, 
    selectedTrackId, 
    setSelectedTrackId, 
    newAlerts, 
    speedMultiplier, 
    isTransitioning,
    isAlarmPlaying,
    isSoundEnabled,
    toggleSound,
    acknowledgeAllThreats,
    environment
  } = useSimulationContext();
  const { sensors, zones, events } = environment;
  
  const displayObservations = useMemo(() => {
    const fusedObservations = observations.filter(o => o.sensor_type === "fused");
    return fusedObservations.length > 0 
      ? fusedObservations 
      : Array.from(new Map(observations.map(o => [o.object_id, o])).values());
  }, [observations]);

  // Track spawn origins and entry vectors for fresh spawns (Section 2.2)
  const spawnInfoMap = useMemo(() => {
    if (isTransitioning) return {};
    const map: Record<string, { time: number; sx: number; sy: number; heading: number }> = {};
    for (const obs of displayObservations) {
      const history = trackHistory[obs.object_id];
      if (history && history.length > 0) {
        const first = history[0];
        const sp = worldToSvg(first.x, first.y);
        map[obs.object_id] = {
          time: first.tick_time,
          sx: sp.sx,
          sy: sp.sy,
          heading: obs.heading,
        };
      } else {
        const sp = worldToSvg(obs.x, obs.y);
        map[obs.object_id] = {
          time: obs.tick_time ?? 0,
          sx: sp.sx,
          sy: sp.sy,
          heading: obs.heading,
        };
      }
    }
    return map;
  }, [displayObservations, trackHistory, isTransitioning]);

  // Pan and Zoom state
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, w: 1200, h: 1200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // On mount, calculate a perfect viewBox to fit screen without letterboxing, centered on the border
  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const aspect = rect.width / rect.height;
        const h = 1100; // fit all cameras (y=100 to y=900) with 100px padding
        const w = h * aspect;
        setViewBox({
          x: 500 - (w * 0.4), // slightly offset to left to show more foreign territory since cameras face left
          y: 500 - h / 2,
          w,
          h
        });
      }
    }
  }, []);

  // Determine if there are active alerts for the alarm
  const activeThreats = displayObservations.filter(o => newAlerts.includes(o.object_id));
  const hasActiveThreat = activeThreats.length > 0;
  
  // Continuous native browser beep when an active threat is present
  useAudioAlarm(hasActiveThreat);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - dragStart.y) / rect.height) * viewBox.h;
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const mouseY = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
    setViewBox(prev => {
      const newW = prev.w * scale;
      const newH = prev.h * scale;
      return {
        x: mouseX - ((mouseX - prev.x) / prev.w) * newW,
        y: mouseY - ((mouseY - prev.y) / prev.h) * newH,
        w: newW,
        h: newH,
      };
    });
  };

  return (
    <div className="relative w-full h-full bg-[#071014] overflow-hidden font-mono-code">
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(30, 60, 80, 0.2)" strokeWidth="0.5" />
          </pattern>
          <pattern id="gridAccent" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(40, 80, 100, 0.35)" strokeWidth="1" />
          </pattern>
          <pattern id="restrictedHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(240, 117, 118, 0.25)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Territory Backgrounds */}
        <rect x="-10000" y="-10000" width="10500" height="20000" fill="rgba(120, 20, 20, 0.06)" /> {/* Foreign (Left) */}
        <rect x="500" y="-10000" width="10500" height="20000" fill="rgba(15, 60, 30, 0.06)" /> {/* Sovereign (Right) */}

        {/* Grid */}
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#gridAccent)" />

        {/* International Border: High-Contrast Prominent Tactical Line */}
        <line x1="500" y1="-5000" x2="500" y2="5000" stroke="#F4B65A" strokeWidth="12" opacity="0.14" />
        <line x1="500" y1="-5000" x2="500" y2="5000" stroke="#F4B65A" strokeWidth="4" opacity="0.95" />
        <line x1="500" y1="-5000" x2="500" y2="5000" stroke="#071014" strokeWidth="2" strokeDasharray="16 10" opacity="0.9" />
        
        {/* Recurring Border Marker Posts with Clear Side Direction */}
        {[-500, -250, 0, 250, 500, 750].map(my => (
          <g key={`ib-marker-${my}`} transform={`translate(500, ${my})`}>
            <rect x="-3" y="-12" width="6" height="24" fill="#F4B65A" rx="1" />
            <circle cx="0" cy="0" r="2" fill="#071014" />
            <g transform="translate(10, -9)">
              <rect x="0" y="0" width="180" height="18" fill="#071014" fillOpacity="0.95" stroke="#F4B65A" strokeWidth="1" rx="3" />
              <text x="8" y="12" fill="#F4B65A" fontSize="9" fontWeight="bold" fontFamily="monospace" letterSpacing="1px">
                ◄ FOREIGN | SOVEREIGN ►
              </text>
            </g>
          </g>
        ))}

        <text x="250" y="50" fill="#F07576" fontSize="13" fontWeight="bold" fontFamily="monospace" opacity="0.4" textAnchor="middle">
          FOREIGN BUFFER TERRITORY
        </text>
        <text x="750" y="50" fill="#6ED694" fontSize="13" fontWeight="bold" fontFamily="monospace" opacity="0.4" textAnchor="middle">
          SOVEREIGN BORDER SECTOR
        </text>

        {/* Zones Layer */}
        <g id="zones">
          {zones.map(z => {
            if (z.zone_type === "virtual_fence" && z.points && z.points.length >= 2) {
              const pts = z.points.map(p => {
                const sp = worldToSvg(p[0], p[1]);
                return `${sp.sx},${sp.sy}`;
              }).join(" ");
              return (
                <polyline key={z.id} points={pts} fill="none" stroke="#48D3D2" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.9" />
              );
            }
            if (z.center && z.radius) {
              const { sx, sy } = worldToSvg(z.center[0], z.center[1]);
              const color = z.zone_type === "restricted" ? "#F07576" : "#F4B65A";
              return (
                <g key={z.id}>
                  <circle cx={sx} cy={sy} r={z.radius} fill={z.zone_type === "restricted" ? "url(#restrictedHatch)" : `${color}18`} stroke={color} strokeWidth="1.5" strokeDasharray="6 4" />
                  <text x={sx} y={sy - z.radius - 8} fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.85">
                    {z.name.toUpperCase()}
                  </text>
                </g>
              );
            }
            if (z.points && z.points.length >= 3) {
              const svgPoints = z.points.map(p => worldToSvg(p[0], p[1]));
              const ptsStr = svgPoints.map(p => `${p.sx},${p.sy}`).join(" ");
              const color = z.zone_type === "restricted" ? "#F07576" : "#F4B65A";
              
              // Centroid and bounds for label placement (1.5)
              const avgX = svgPoints.reduce((acc, p) => acc + p.sx, 0) / svgPoints.length;
              const minY = Math.min(...svgPoints.map(p => p.sy));
              const maxY = Math.max(...svgPoints.map(p => p.sy));
              const centerY = (minY + maxY) / 2;
              const isVerticalStrip = (maxY - minY) > 200 && Math.abs(svgPoints[0].sx - svgPoints[1].sx) < 150;

              return (
                <g key={z.id}>
                  <polygon 
                    points={ptsStr} 
                    fill={z.zone_type === "restricted" ? "url(#restrictedHatch)" : `${color}18`} 
                    stroke={color} 
                    strokeWidth="1.5" 
                    strokeDasharray={z.zone_type === "warning" ? "6 4" : "none"}
                  />
                  {isVerticalStrip ? (
                    <text 
                      x={avgX} 
                      y={centerY} 
                      transform={`rotate(-90 ${avgX} ${centerY})`} 
                      fill={color} 
                      fontSize="10" 
                      fontFamily="monospace" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      letterSpacing="2px"
                      opacity="0.85"
                    >
                      {z.name.toUpperCase()}
                    </text>
                  ) : (
                    <text 
                      x={avgX} 
                      y={minY - 8} 
                      fill={color} 
                      fontSize="10" 
                      fontFamily="monospace" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      opacity="0.85"
                    >
                      {z.name.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          })}
        </g>

        <RotatingCameraLayer 
          sensors={sensors} 
          observations={observations}
          worldToSvg={worldToSvg} 
          speedMultiplier={speedMultiplier}
        />

        {/* Trail Layer */}
        <g id="trails">
          {Object.entries(trackHistory).map(([trackId, trail]) => {
            if (trail.length < 2) return null;
            return (
              <g key={`trail-${trackId}`}>
                {trail.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = trail[i - 1];
                  const p1 = worldToSvg(prev.x, prev.y);
                  const p2 = worldToSvg(pt.x, pt.y);
                  // Filter out jumps / teleports between spawn / reset points (2.1)
                  const segDist = Math.hypot(p2.sx - p1.sx, p2.sy - p1.sy);
                  if (segDist > 120) return null;
                  const opacity = 0.1 + (0.7 * (i / trail.length)); // Fades out
                  return (
                    <line 
                      key={`trail-seg-${i}`} 
                      x1={p1.sx} y1={p1.sy} 
                      x2={p2.sx} y2={p2.sy} 
                      stroke="#48D3D2" 
                      opacity={opacity}
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Spawn Visuals Layer: Tactical Entry Sonar Ping & Vector Arrow (2.2) */}
        <g id="spawn-visuals">
          {displayObservations.map(obs => {
            const spawnInfo = spawnInfoMap[obs.object_id];
            if (!spawnInfo) return null;
            const ageSeconds = Math.max(0, (obs.tick_time ?? 0) - spawnInfo.time);
            if (ageSeconds >= 3.5) return null;
            
            const category = getTacticalCategory(obs.object_type, obs.object_id);
            const color = getTacticalColor(category);
            const fade = Math.max(0, 1 - (ageSeconds / 3.5));

            return (
              <g key={`spawn-${obs.object_id}`} opacity={fade} pointerEvents="none">
                {/* Expanding sonar ripple */}
                <circle 
                  cx={spawnInfo.sx} 
                  cy={spawnInfo.sy} 
                  r="26" 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="1.6" 
                  strokeDasharray="4 2" 
                  className="animate-ping origin-center" 
                  opacity="0.8" 
                />
                {/* Origin crosshair pin */}
                <circle cx={spawnInfo.sx} cy={spawnInfo.sy} r="5" fill="none" stroke={color} strokeWidth="1.2" />
                <circle cx={spawnInfo.sx} cy={spawnInfo.sy} r="1.5" fill="#ffffff" />
                {/* Entry Vector Arrow */}
                <g transform={`translate(${spawnInfo.sx}, ${spawnInfo.sy}) rotate(${90 - spawnInfo.heading})`}>
                  <line x1="0" y1="0" x2="34" y2="0" stroke={color} strokeWidth="2" strokeDasharray="4 2" opacity="0.85" />
                  <polygon points="40,0 32,-4 32,4" fill={color} />
                </g>
                {/* Tactical Spawn Callout */}
                <text 
                  x={spawnInfo.sx + 10} 
                  y={spawnInfo.sy - 12} 
                  fill={color} 
                  fontSize="8" 
                  fontFamily="monospace" 
                  fontWeight="bold" 
                  letterSpacing="1px"
                  opacity="0.9"
                >
                  ENTRY VECTOR // DETECTED
                </text>
              </g>
            );
          })}
        </g>

        {/* Tracks Layer with Smooth Crossfade & Collision Avoidance */}
        <g id="tracks" className={`transition-opacity duration-300 ${isTransitioning ? "opacity-30" : "opacity-100"}`}>
          {displayObservations.map((obs) => {
            const { sx, sy } = worldToSvg(obs.x, obs.y);
            const isAlert = newAlerts.includes(obs.object_id);
            const isSelected = selectedTrackId === obs.object_id;
            
            const spawnInfo = spawnInfoMap[obs.object_id];
            const ageSeconds = spawnInfo ? Math.max(0, (obs.tick_time ?? 0) - spawnInfo.time) : 999;
            
            // Smooth interpolation strictly synced with backend 4Hz tick rate (0.25s)
            // On fresh spawn (<0.35s), disable coordinate transition to avoid snap-sliding across screen
            const transitionDuration = ageSeconds < 0.35 ? 0 : 0.25;
            const opacity = Math.min(1, Math.max(0.1, ageSeconds / 0.5));
            
            return (
              <g 
                key={obs.object_id} 
                transform={`translate(${sx}, ${sy})`}
                style={{ 
                  transition: transitionDuration > 0 ? `transform ${transitionDuration}s linear, opacity 0.4s ease-out` : `opacity 0.4s ease-out`,
                  opacity 
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedTrackId(obs.object_id); }}
                className="cursor-pointer"
              >
                {/* Circular Track Marker Badge (64px) with priority rings and centered mono label */}
                <TrackMarkerBadge
                  objectType={obs.object_type}
                  objectId={obs.object_id}
                  speed={obs.speed}
                  altitude={obs.altitude}
                  heading={obs.heading}
                  isAlert={isAlert}
                  isSelected={isSelected}
                  size={64}
                  isSvgChild={true}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <SimulationControlBar />

      {/* Tactical Audio & Alarm HUD Status Controls */}
      <div className="absolute top-5 right-4 z-40 pointer-events-auto flex items-center gap-2 font-mono-code">
        {isAlarmPlaying && (
          <button
            type="button"
            onClick={acknowledgeAllThreats}
            className="flex items-center gap-2 bg-[#F07576]/20 hover:bg-[#F07576]/30 border border-[#F07576] text-[#F07576] px-3 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_16px_rgba(240,117,118,0.4)] animate-pulse transition-all cursor-pointer"
            title="Silence alarms and acknowledge active sector threats"
          >
            <ShieldAlert className="w-4 h-4 text-[#F07576]" />
            <span className="tracking-wider uppercase">ALARM ACTIVE · SILENCE</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
            isSoundEnabled
              ? "bg-[#0D171C]/90 border-[#192830] text-[#48D3D2] hover:border-[#48D3D2]/50 hover:bg-[#101E24]"
              : "bg-[#F07576]/15 border-[#F07576]/50 text-[#F07576] hover:bg-[#F07576]/25"
          }`}
          title={isSoundEnabled ? "Alert audio is armed (Click to mute)" : "Alert audio is muted (Click to unmute)"}
        >
          {isSoundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#48D3D2]" />
              <span className="text-[10px] tracking-wider uppercase text-[#E8F1F4]">AUDIO ARMED</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-[#F07576]" />
              <span className="text-[10px] tracking-wider uppercase text-[#F07576]">AUDIO MUTED</span>
            </>
          )}
        </button>
      </div>

      <LiveCounters
        tracksCount={displayObservations.length}
        sensors={sensors}
        zones={zones}
      />

      <ActiveAlertsPanel alerts={newAlerts} />

      <EventTimeline events={events} />

      {/* Tactical HUD Symbology Legend (2.2: Mode & Object Specific Symbols) */}
      <div className="absolute bottom-10 left-4 bg-[#0D171C]/95 backdrop-blur-md border border-[#192830] rounded-xl p-3 text-[10px] z-20 space-y-2 w-60 font-mono-code shadow-2xl pointer-events-none">
        <h4 className="font-bold border-b border-[#192830] pb-1.5 text-[#758890] tracking-wider uppercase flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#48D3D2]" />
          <span>TACTICAL SYMBOLOGY</span>
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <line x1="-6" y1="-6" x2="6" y2="6" stroke="#48D3D2" strokeWidth="1.5" />
              <line x1="-6" y1="6" x2="6" y2="-6" stroke="#48D3D2" strokeWidth="1.5" />
              <circle cx="-6" cy="-6" r="1.8" fill="#48D3D2" />
              <circle cx="6" cy="-6" r="1.8" fill="#48D3D2" />
              <circle cx="-6" cy="6" r="1.8" fill="#48D3D2" />
              <circle cx="6" cy="6" r="1.8" fill="#48D3D2" />
              <circle cx="0" cy="0" r="1" fill="#ffffff" />
            </svg> 
            <span>Quadcopter UAV</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <polygon points="0,-8 8,5 0,1 -8,5" fill="#48D3D2" />
              <circle cx="0" cy="0" r="1" fill="#ffffff" />
            </svg> 
            <span>Stealth / Aerial Bogey</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <rect x="-8" y="-6" width="2" height="12" rx="0.5" fill="#AD91FF" />
              <rect x="6" y="-6" width="2" height="12" rx="0.5" fill="#AD91FF" />
              <rect x="-5" y="-5" width="10" height="10" rx="1" fill="#0A161C" stroke="#AD91FF" strokeWidth="1" />
              <circle cx="0" cy="0" r="2.5" fill="#AD91FF" />
              <line x1="0" y1="0" x2="0" y2="-8" stroke="#AD91FF" strokeWidth="1.5" strokeLinecap="round" />
            </svg> 
            <span>Heavy Tank</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <rect x="-6" y="-4" width="12" height="10" rx="1" fill="#0A161C" stroke="#AD91FF" strokeWidth="1" />
              <rect x="-5" y="-9" width="10" height="5" rx="1" fill="#AD91FF" />
            </svg> 
            <span>Military Convoy / Truck</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <circle cx="-4" cy="-3" r="2" fill="#F4B65A" />
              <circle cx="4" cy="-3" r="2" fill="#F4B65A" />
              <circle cx="0" cy="4" r="2" fill="#F4B65A" />
            </svg> 
            <span>Troop Infiltrator Squad</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <circle cx="0" cy="0" r="3" fill="#6ED694" />
              <circle cx="0" cy="0" r="6" fill="none" stroke="#6ED694" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            </svg> 
            <span>Personnel / Civilian</span>
          </div>
          <div className="flex items-center gap-2 text-[#E8F1F4]">
            <svg width="16" height="16" viewBox="-10 -10 20 20">
              <path d="M -6,-1 Q -3,-4 0,-1 Q 3,-4 6,-1" fill="none" stroke="#758890" strokeWidth="1.5" strokeLinecap="round" />
            </svg> 
            <span>Avian Wildlife</span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#091217] border-t border-[#192830] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono-code text-[#758890] z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6ED694] shadow-[0_0_6px_#6ED694]" />
            <span className="font-bold text-[#E8F1F4]">BOP ALPHA-07</span>
          </div>
          <span className="text-[#192830]">|</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#758890]">SYS TIME</span>
            <span className="bg-[#071014] text-[#48D3D2] border border-[#192830] px-2 py-0.5 rounded text-[10px] font-bold">
              {new Date().toLocaleTimeString("en-GB")} IST
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#52676F]">
          <span className="flex items-center gap-1">
            <span className="text-[#48D3D2]">SCROLL</span> ZOOM
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="text-[#48D3D2]">DRAG</span> PAN
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="text-[#48D3D2]">CLICK</span> TARGET LOCK
          </span>
        </div>
      </div>
    </div>
  );
}
