import React from "react";
import { Navigation } from "lucide-react";

interface CompassTapeProps {
  heading: number; // 0 to 359
  pitch?: number;   // e.g. -90 to +90
}

export const CompassTape: React.FC<CompassTapeProps> = ({ heading, pitch = 0 }) => {
  const getCardinal = (deg: number): string => {
    const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return cardinals[index];
  };

  const cardinal = getCardinal(heading);

  // Generate tick marks within +/- 45 degrees of current heading
  const visibleTicks = [];
  const startDeg = Math.floor((heading - 40) / 10) * 10;
  const endDeg = Math.ceil((heading + 40) / 10) * 10;

  for (let d = startDeg; d <= endDeg; d += 10) {
    const normDeg = ((d % 360) + 360) % 360;
    // Relative position from center (-40 to +40 degrees mapped to percentage)
    const diff = d - heading;
    const xPercent = 50 + (diff / 80) * 100;

    let label = "";
    let isMajor = false;
    if (normDeg === 0) { label = "N"; isMajor = true; }
    else if (normDeg === 45) { label = "NE"; }
    else if (normDeg === 90) { label = "E"; isMajor = true; }
    else if (normDeg === 135) { label = "SE"; }
    else if (normDeg === 180) { label = "S"; isMajor = true; }
    else if (normDeg === 225) { label = "SW"; }
    else if (normDeg === 270) { label = "W"; isMajor = true; }
    else if (normDeg === 315) { label = "NW"; }
    else { label = String(normDeg).padStart(3, "0"); }

    visibleTicks.push({ deg: normDeg, xPercent, label, isMajor });
  }

  return (
    <div className="bg-[#071014]/90 border border-[#192830] rounded-xl px-4 py-1.5 shadow-2xl backdrop-blur-md text-[#E8F1F4] font-mono-code flex flex-col items-center select-none w-72 sm:w-84 overflow-hidden pointer-events-none">
      {/* Top Readout Header */}
      <div className="w-full flex items-center justify-between text-[10px] pb-1 border-b border-[#192830]">
        <div className="flex items-center gap-1.5 text-[#48D3D2] font-bold">
          <Navigation className="w-3 h-3 text-[#48D3D2] -rotate-45" />
          <span>BEARING: {String(heading).padStart(3, "0")}° {cardinal}</span>
        </div>
        <span className="text-[#758890] text-[9px]">
          PITCH: {pitch > 0 ? `+${pitch}` : pitch}°
        </span>
      </div>

      {/* Horizontal Sliding Compass Tape */}
      <div className="relative w-full h-7 overflow-hidden mt-1">
        {/* Center reticle hairline */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-[#48D3D2] z-10 shadow-[0_0_8px_rgba(72,211,210,0.8)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#48D3D2]" />
        </div>

        {/* Ticks and Labels */}
        {visibleTicks.map((t, idx) => {
          if (t.xPercent < 2 || t.xPercent > 98) return null;
          const isNorth = t.label === "N";

          return (
            <div
              key={idx}
              className="absolute top-0 flex flex-col items-center transition-all duration-75 ease-out -translate-x-1/2"
              style={{ left: `${t.xPercent}%` }}
            >
              <div
                className={`w-px ${
                  isNorth
                    ? "h-3 bg-[#F07576]"
                    : t.isMajor
                    ? "h-2.5 bg-[#48D3D2]"
                    : "h-1.5 bg-[#758890]"
                }`}
              />
              <span
                className={`text-[8px] font-bold mt-0.5 leading-none ${
                  isNorth
                    ? "text-[#F07576]"
                    : t.isMajor
                    ? "text-[#48D3D2]"
                    : "text-[#758890]"
                }`}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
