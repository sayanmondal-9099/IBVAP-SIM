import type { SimulationEvent } from "../../hooks/useEnvironmentPoll";
import { Activity } from "lucide-react";

export function EventTimeline({ events }: { events: SimulationEvent[] }) {
  if (events.length === 0) return null;

  // Show only last 5 events to keep it compact
  const recentEvents = events.slice().reverse().slice(0, 5);

  return (
    <div className="absolute top-[185px] right-4 w-52 bg-[#0D171C]/95 backdrop-blur-md border border-[#192830] hover:border-[#48D3D2]/40 rounded-xl flex flex-col shadow-2xl pointer-events-auto z-10 max-h-[35vh] overflow-hidden font-mono-code transition-all">
      <div className="px-3 py-2 border-b border-[#192830] flex justify-between items-center bg-[#101E24]">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#48D3D2]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#48D3D2]">EVENT LOG</span>
        </div>
        <span className="text-[10px] text-[#758890] font-bold">{events.length}</span>
      </div>
      <div className="p-2 overflow-y-auto max-h-[28vh] custom-scrollbar">
        <div className="space-y-2">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="text-[10px] flex flex-col gap-1 pb-2 border-b border-[#192830] last:border-0 last:pb-0 relative pl-2.5">
              <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#48D3D2]/40 rounded-full" />
              <div className="flex justify-between items-center">
                <span className="text-[#758890] font-bold text-[9px]">T+{evt.tick_time.toFixed(1)}s</span>
                <span className="font-bold text-[8px] uppercase bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30 px-1.5 py-0.5 rounded">
                  {evt.event_type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[#E8F1F4] text-[9px] leading-tight">{evt.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
