import type { Track } from "../../contexts/SimulationContext";
import type { Observation } from "../../hooks/useSimulationSocket";
import { X, Target, Crosshair, Activity, Compass, Mountain, Gauge } from "lucide-react";
import { StatusPill } from "../primitives/StatusPill";

interface TrackDetailsPanelProps {
  track: Track;
  observation?: Observation;
  onClose: () => void;
}

export function TrackDetailsPanel({ track, observation, onClose }: TrackDetailsPanelProps) {
  const getVariant = (type: string): "red" | "amber" | "cyan" => {
    const t = type.toLowerCase();
    if (t.includes("drone") || t.includes("tank") || t.includes("vehicle")) return "red";
    if (t.includes("person") || t.includes("intruder")) return "amber";
    return "cyan";
  };

  return (
    <div className="w-80 bg-[#071014]/95 border border-[#192830] rounded-xl text-[#E8F1F4] font-mono-code shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="bg-[#101E24] border-b border-[#192830] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#48D3D2]" />
          <span className="text-xs font-bold tracking-wider uppercase text-[#E8F1F4]">
            TRACK TELEMETRY
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded text-[#758890] hover:text-[#E8F1F4] hover:bg-[#192830] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Track ID & Classification */}
        <div className="flex items-center justify-between pb-2 border-b border-[#192830]">
          <div>
            <div className="text-[9px] text-[#758890] uppercase font-bold">TRACK ID</div>
            <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">{track.id}</div>
          </div>
          <StatusPill 
            label={track.object_type.toUpperCase()} 
            variant={getVariant(track.object_type)} 
            size="xs" 
          />
        </div>

        {/* Kinematics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#101E24] border border-[#192830] p-2 rounded-lg">
            <div className="text-[9px] text-[#758890] uppercase font-bold flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[#48D3D2]" /> SPEED
            </div>
            <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">{track.speed.toFixed(1)} m/s</div>
          </div>

          <div className="bg-[#101E24] border border-[#192830] p-2 rounded-lg">
            <div className="text-[9px] text-[#758890] uppercase font-bold flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#F4B65A]" /> HEADING
            </div>
            <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">{track.heading.toFixed(1)}°</div>
          </div>

          <div className="bg-[#101E24] border border-[#192830] p-2 rounded-lg">
            <div className="text-[9px] text-[#758890] uppercase font-bold flex items-center gap-1">
              <Mountain className="w-3 h-3 text-[#AD91FF]" /> ALTITUDE
            </div>
            <div className="text-xs font-bold text-[#AD91FF] mt-0.5">{track.altitude.toFixed(1)} m</div>
          </div>

          <div className="bg-[#101E24] border border-[#192830] p-2 rounded-lg">
            <div className="text-[9px] text-[#758890] uppercase font-bold flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-[#6ED694]" /> SECTOR POS
            </div>
            <div className="text-[10px] font-bold text-[#E8F1F4] mt-0.5">
              X:{track.x.toFixed(0)} Y:{track.y.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Observation Provenance */}
        {observation && (
          <div className="pt-2 border-t border-[#192830] space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#758890] uppercase font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#48D3D2]" /> SENSOR TYPE:
              </span>
              <span className="text-[#48D3D2] font-bold uppercase">{observation.sensor_type}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#758890]">CONFIDENCE RATING</span>
                <span className="text-[#6ED694] font-bold">{(observation.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#101E24] border border-[#192830] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#48D3D2] to-[#6ED694] rounded-full"
                  style={{ width: `${Math.min(100, Math.round(observation.confidence * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

