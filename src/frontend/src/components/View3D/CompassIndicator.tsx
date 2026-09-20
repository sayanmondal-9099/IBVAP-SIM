import React from "react";
import { Compass as CompassIcon, RotateCcw } from "lucide-react";

interface CompassIndicatorProps {
  heading: number; // 0 to 359 degrees
  onResetNorth?: () => void;
}

export const CompassIndicator: React.FC<CompassIndicatorProps> = ({ heading, onResetNorth }) => {
  const getCardinal = (deg: number): string => {
    const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return cardinals[index];
  };

  const cardinal = getCardinal(heading);

  return (
    <div className="bg-[#071014]/90 border border-[#192830] rounded-xl p-3 shadow-xl backdrop-blur-md text-[#E8F1F4] font-mono-code flex items-center gap-3 select-none">
      {/* Compass Circular Dial */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Outer ring */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="#192830" strokeWidth="2" />
          
          {/* 30-degree tick marks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="8"
              x2="50"
              y2={deg % 90 === 0 ? "15" : "11"}
              stroke={deg === 0 ? "#F07576" : deg % 90 === 0 ? "#48D3D2" : "#758890"}
              strokeWidth={deg % 90 === 0 ? "2.5" : "1.2"}
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {/* North needle (Red) */}
          <polygon points="50,16 45,50 55,50" fill="#F07576" />
          {/* South needle (Muted) */}
          <polygon points="50,84 45,50 55,50" fill="#2B3E48" />
          
          {/* Central pivot hub */}
          <circle cx="50" cy="50" r="4" fill="#071014" stroke="#48D3D2" strokeWidth="1.5" />
        </svg>

        {/* Static center reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#48D3D2]" />
        </div>
      </div>

      {/* Telemetry Readout */}
      <div className="flex flex-col min-w-[90px]">
        <div className="flex items-center gap-1.5 text-[9px] text-[#758890] uppercase font-bold tracking-wider">
          <CompassIcon className="w-3 h-3 text-[#48D3D2]" />
          <span>BEARING</span>
        </div>
        <div className="text-sm font-bold text-[#E8F1F4] leading-tight flex items-baseline gap-1 mt-0.5">
          <span>{String(heading).padStart(3, "0")}°</span>
          <span className="text-xs text-[#48D3D2] font-bold">{cardinal}</span>
        </div>
      </div>

      {/* Reset to North Button */}
      {onResetNorth && (
        <button
          type="button"
          onClick={onResetNorth}
          title="Reset camera orientation to North (0°)"
          className="p-1.5 rounded-lg bg-[#101E24] hover:bg-[#132128] border border-[#192830] hover:border-[#48D3D2]/50 text-[#758890] hover:text-[#48D3D2] transition-colors cursor-pointer"
          aria-label="Reset orientation to North"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
