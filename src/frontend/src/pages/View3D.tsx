import { useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "../components/View3D/Scene";
import { TrackDetailsPanel } from "../components/View3D/TrackDetailsPanel";
import { CompassIndicator } from "../components/View3D/CompassIndicator";
import { CompassTape } from "../components/View3D/CompassTape";
import { useSimulationContext } from "../contexts/SimulationContext";
import type { Track } from "../contexts/SimulationContext";
import type { Observation } from "../hooks/useSimulationSocket";
import { SimulationControlBar } from "../components/simulation/SimulationControlBar";
import { LiveCounters } from "../components/simulation/LiveCounters";
import { 
  AlertTriangle, 
  Radio, 
  WifiOff, 
  Box,
  Layers,
  Eye,
  RotateCcw
} from "lucide-react";

// Robust Error Boundary for WebGL crashes
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL 3D Context Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#071014] text-[#E8F1F4] font-mono-code p-6">
          <div className="text-center p-8 bg-[#0D171C] border border-[#F07576]/40 rounded-xl shadow-2xl max-w-md space-y-4">
            <AlertTriangle className="w-10 h-10 text-[#F07576] mx-auto animate-pulse" />
            <div className="text-sm font-bold tracking-widest text-[#F07576] uppercase">
              3D VISUALIZATION CONTEXT FAULT
            </div>
            <p className="text-xs text-[#758890] leading-relaxed">
              The WebGL rendering context was interrupted or hardware acceleration is unavailable. Simulation telemetry continues streaming on 2D operational displays.
            </p>
            <div className="text-[10px] text-[#48D3D2] border border-[#48D3D2]/30 bg-[#48D3D2]/10 py-1.5 px-3 rounded-lg">
              DATA STREAMING VIA COMMAND MAP & RADAR
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function View3D() {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [cameraHeading, setCameraHeading] = useState<number>(0);
  const [cameraPitch, setCameraPitch] = useState<number>(-31);
  const [presetTrigger, setPresetTrigger] = useState<{ type: "ortho" | "iso" | "perimeter" | "north"; time: number } | null>(null);
  const { tracks, observations, simulationState, environment } = useSimulationContext();

  const selectedTrack = tracks?.find((t: Track) => t.id === selectedTrackId);
  const selectedObservation = observations?.find((o: Observation) => o.object_id === selectedTrackId);
  const isNetworkOffline = simulationState?.network_status === "offline";

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#071014] text-[#E8F1F4] flex flex-col overflow-hidden font-mono-code">
      {/* Permanent Simulation Notice Banner */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-[#0D171C]/90 border-b border-[#192830] text-[#F4B65A] text-center text-[9px] py-1 px-4 uppercase tracking-[0.2em] backdrop-blur-md flex items-center justify-center gap-2">
        <Radio className="w-3 h-3 text-[#F4B65A] animate-pulse" />
        <span>SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION</span>
      </div>

      {/* Offline Alert Badge */}
      {isNetworkOffline && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#F07576]/15 border border-[#F07576]/60 text-[#F07576] px-3.5 py-1.5 rounded-lg shadow-lg z-30 flex items-center gap-2 backdrop-blur-md animate-pulse">
          <WifiOff className="w-4 h-4 text-[#F07576]" />
          <span className="text-xs font-bold tracking-wider">OFFLINE BUFFERING ACTIVE · STATE STALE</span>
        </div>
      )}

      {/* Top Simulation Control Bar */}
      <div className="z-20 pt-6 border-b border-[#192830] bg-[#071014]/90 backdrop-blur-md pointer-events-auto">
        <SimulationControlBar />
      </div>

      {/* Top-Center Military HUD Compass Tape */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <CompassTape heading={cameraHeading} pitch={cameraPitch} />
      </div>

      {/* Quick Camera Viewport Preset Buttons (Top-Left) */}
      <div className="absolute top-20 left-4 z-20 flex items-center gap-1.5 bg-[#071014]/90 border border-[#192830] p-1 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto">
        <button
          type="button"
          onClick={() => setPresetTrigger({ type: "ortho", time: Date.now() })}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-[#101E24] hover:bg-[#132128] border border-[#192830] hover:border-[#48D3D2]/50 text-[#E8F1F4] hover:text-[#48D3D2] flex items-center gap-1 cursor-pointer"
          title="Top-Down 90° Orthogonal View"
        >
          <Layers className="w-3 h-3 text-[#48D3D2]" />
          <span>TOP-DOWN</span>
        </button>
        <button
          type="button"
          onClick={() => setPresetTrigger({ type: "iso", time: Date.now() })}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-[#101E24] hover:bg-[#132128] border border-[#192830] hover:border-[#48D3D2]/50 text-[#E8F1F4] hover:text-[#48D3D2] flex items-center gap-1 cursor-pointer"
          title="Angled 45° Tactical Isometric View"
        >
          <Box className="w-3 h-3 text-[#AD91FF]" />
          <span>ISOMETRIC</span>
        </button>
        <button
          type="button"
          onClick={() => setPresetTrigger({ type: "perimeter", time: Date.now() })}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-[#101E24] hover:bg-[#132128] border border-[#192830] hover:border-[#48D3D2]/50 text-[#E8F1F4] hover:text-[#48D3D2] flex items-center gap-1 cursor-pointer"
          title="Perimeter Low-Angle Vantage"
        >
          <Eye className="w-3 h-3 text-[#6ED694]" />
          <span>PERIMETER</span>
        </button>
        <button
          type="button"
          onClick={() => setPresetTrigger({ type: "north", time: Date.now() })}
          className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-[#101E24] hover:bg-[#132128] border border-[#192830] hover:border-[#F07576]/50 text-[#F07576] flex items-center gap-1 cursor-pointer"
          title="Reset Orientation to North (000°)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>NORTH</span>
        </button>
      </div>

      {/* Target Counts & Environment Live Counters */}
      {environment && (
        <div className="absolute top-20 right-4 z-20 pointer-events-auto">
          <LiveCounters 
            tracksCount={new Set(observations.filter((o) => o.sensor_type === "fused").map((o) => o.object_id)).size || tracks.length} 
            sensors={environment.sensors}
            zones={environment.zones}
          />
        </div>
      )}

      {/* Selected Track Details Overlay */}
      {selectedTrack && (
        <div className="absolute top-34 left-4 z-20 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar pointer-events-auto animate-in fade-in duration-150">
          <TrackDetailsPanel 
            track={selectedTrack} 
            observation={selectedObservation} 
            onClose={() => setSelectedTrackId(null)} 
          />
        </div>
      )}

      {/* 3D Viewport Controls & Telemetry Hint Deck (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-[#071014]/90 border border-[#192830] text-[#758890] text-[10px] p-3.5 rounded-xl shadow-xl backdrop-blur-md space-y-2 max-w-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#192830]">
            <span className="font-bold text-[#E8F1F4] flex items-center gap-1.5 tracking-wider">
              <Box className="w-3.5 h-3.5 text-[#48D3D2]" />
              3D ELEVATION VIEWPORT
            </span>
            <span className="text-[9px] text-[#48D3D2]">WEBGL</span>
          </div>
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between gap-4">
              <span>LEFT CLICK + DRAG</span> 
              <span className="text-[#48D3D2] font-bold">ORBIT CAMERA</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>RIGHT CLICK + DRAG</span> 
              <span className="text-[#48D3D2] font-bold">PAN TERRAIN</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>WHEEL / PINCH</span> 
              <span className="text-[#48D3D2] font-bold">ZOOM RANGE</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>CLICK TARGET</span> 
              <span className="text-[#6ED694] font-bold">INSPECT KINEMATICS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Compass Rose Heading Indicator (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <CompassIndicator 
          heading={cameraHeading} 
          onResetNorth={() => setPresetTrigger({ type: "north", time: Date.now() })} 
        />
      </div>

      {/* Main 3D Canvas Canvas Stage */}
      <div className="flex-1 w-full h-full relative z-0">
        <WebGLErrorBoundary>
          <Canvas
            camera={{ position: [0, 450, 750], fov: 45 }}
            gl={{ antialias: true }}
            onPointerMissed={() => setSelectedTrackId(null)}
          >
            {/* Ambient tactical fog matching HUD backdrop */}
            <fog attach="fog" args={["#071014", 600, 2400]} />
            <Scene 
              selectedTrackId={selectedTrackId} 
              onSelectTrack={setSelectedTrackId} 
              onHeadingChange={setCameraHeading}
              onPitchChange={setCameraPitch}
              resetNorthTrigger={0}
              presetTrigger={presetTrigger}
            />
          </Canvas>
        </WebGLErrorBoundary>
        
        {/* Tactical Scanline & Coordinate Grid Background Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(72, 211, 210, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(72, 211, 210, 0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            backgroundPosition: "center center"
          }} 
        />
      </div>
    </div>
  );
}
