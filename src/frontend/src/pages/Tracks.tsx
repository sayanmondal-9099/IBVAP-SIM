import { useSimulationContext } from "../contexts/SimulationContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Route } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { TacticalMetricsGrid } from "../components/simulation/TacticalMetricsGrid";
import { StatusPill } from "../components/primitives/StatusPill";
import { TrackMarkerBadge } from "../components/simulation/TrackMarkerBadge";

export default function Tracks() {
  const { tracks, setSelectedTrackId } = useSimulationContext();

  const getTypeVariant = (type: string): "cyan" | "amber" | "violet" | "green" => {
    const t = type.toLowerCase();
    if (["drone", "helicopter", "aircraft", "unknown aerial object"].some((k) => t.includes(k))) {
      return "green";
    }
    if (["vehicle", "truck", "tank"].some((k) => t.includes(k))) {
      return "violet";
    }
    if (t.includes("person")) {
      return "cyan";
    }
    return "amber";
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-y-auto custom-scrollbar">
      {/* Top Metrics Grid */}
      <TacticalMetricsGrid onSelectTrack={(id) => setSelectedTrackId(id)} />

      {/* Main Tracks Table Panel */}
      <DashboardCard
        title="LIVE MULTI-SENSOR TRACKS"
        subtitle="Real-time fused telemetry from optical and radar sensors"
        icon={<Route className="w-4 h-4 text-[#48D3D2]" />}
        className="flex-1 min-h-[380px]"
        contentClassName="p-0 overflow-hidden flex flex-col"
        action={
          <div className="flex items-center gap-2 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#48D3D2] shadow-[0_0_6px_#48D3D2]" />
            <span className="font-mono-code text-[#48D3D2] font-bold text-xs tracking-wider">
              {tracks.length.toString().padStart(2, "0")} ACTIVE
            </span>
          </div>
        }
      >
        <div className="overflow-auto flex-1 custom-scrollbar">
          <Table>
            <TableHeader className="bg-[#101E24] sticky top-0 border-b border-[#192830] shadow-sm z-10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-4">
                  TRACK ID
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  CLASSIFICATION
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  SECTOR (X, Y)
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  SPEED
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  HEADING
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 text-right px-4">
                  PROVENANCE
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.length === 0 ? (
                <TableRow className="hover:bg-transparent border-[#192830]">
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-[#758890] font-mono-code text-xs uppercase tracking-wider"
                  >
                    No active synthetic tracks detected
                  </TableCell>
                </TableRow>
              ) : (
                tracks.map((track) => (
                  <TableRow
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className="border-b border-[#192830] hover:bg-[#101E24] transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-mono-code text-xs font-bold text-[#E8F1F4] group-hover:text-[#48D3D2] transition-colors px-4">
                      <div className="flex items-center gap-2.5">
                        <TrackMarkerBadge
                          objectType={track.object_type}
                          objectId={track.id}
                          size={24}
                          showLabel={false}
                        />
                        <span>{track.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={track.object_type.toUpperCase()}
                        variant={getTypeVariant(track.object_type)}
                        size="xs"
                      />
                    </TableCell>
                    <TableCell className="font-mono-code text-xs text-[#758890]">
                      {track.x.toFixed(1)}, {track.y.toFixed(1)}
                    </TableCell>
                    <TableCell className="font-mono-code text-xs text-[#E8F1F4]">
                      {track.speed.toFixed(1)}{" "}
                      <span className="text-[#52676F]">m/s</span>
                    </TableCell>
                    <TableCell className="font-mono-code text-xs text-[#E8F1F4]">
                      {track.heading.toFixed(1)}°
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <span className="text-[9px] font-mono-code tracking-wider px-1.5 py-0.5 rounded bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30">
                        SYNTHETIC FUSION
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>
    </div>
  );
}

