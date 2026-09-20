import type { Sensor, Zone } from "../../hooks/useEnvironmentPoll";
import { Crosshair, Map, Video } from "lucide-react";

interface LiveCountersProps {
  tracksCount: number;
  sensors: Sensor[];
  zones: Zone[];
}

export function LiveCounters({ tracksCount, sensors, zones }: LiveCountersProps) {
  const onlineSensors = sensors.filter(s => s.status === 'online').length;
  const degradedSensors = sensors.filter(s => s.status === 'degraded').length;
  const offlineSensors = sensors.filter(s => s.status === 'offline').length;

  return (
    <div className="absolute top-5 right-4 flex flex-col gap-2.5 pointer-events-none z-10 font-mono-code w-52 select-none">
      
      {/* Live Tracks Counter */}
      <div className="bg-[#0D171C]/90 backdrop-blur-md border border-[#192830] hover:border-[#48D3D2]/40 rounded-xl flex flex-col p-2.5 shadow-xl relative overflow-hidden transition-all pointer-events-auto">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#48D3D2]"></div>
        <div className="flex justify-between items-center pl-2">
          <span className="text-[10px] uppercase text-[#48D3D2] tracking-wider font-bold flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#48D3D2]" />
            <span>LIVE TRACKS</span>
          </span>
          <span className="text-xl font-bold text-[#E8F1F4] leading-none">
            {tracksCount.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Sensors Counter */}
      <div className="bg-[#0D171C]/90 backdrop-blur-md border border-[#192830] hover:border-[#6ED694]/40 rounded-xl flex flex-col p-2.5 shadow-xl relative overflow-hidden transition-all pointer-events-auto">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6ED694]"></div>
        <div className="flex flex-col gap-1.5 pl-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-[#758890] tracking-wider font-bold flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#6ED694]" />
              <span>SENSORS</span>
            </span>
            <span className="text-xl font-bold text-[#E8F1F4] leading-none">
              {sensors.length.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] pt-0.5 border-t border-[#192830]">
            <div className="flex items-center gap-1 text-[#6ED694]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6ED694] shadow-[0_0_6px_#6ED694]" />
              <span>{onlineSensors}</span>
            </div>
            <div className="flex items-center gap-1 text-[#F4B65A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B65A] shadow-[0_0_6px_#F4B65A]" />
              <span>{degradedSensors}</span>
            </div>
            <div className="flex items-center gap-1 text-[#F07576]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F07576]" />
              <span>{offlineSensors}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zones Counter */}
      <div className="bg-[#0D171C]/90 backdrop-blur-md border border-[#192830] hover:border-[#AD91FF]/40 rounded-xl flex flex-col p-2.5 shadow-xl relative overflow-hidden transition-all pointer-events-auto">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#AD91FF]"></div>
        <div className="flex justify-between items-center pl-2">
          <span className="text-[10px] uppercase text-[#758890] tracking-wider font-bold flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-[#AD91FF]" />
            <span>ZONES</span>
          </span>
          <span className="text-xl font-bold text-[#E8F1F4] leading-none">
            {zones.length.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

    </div>
  );
}

