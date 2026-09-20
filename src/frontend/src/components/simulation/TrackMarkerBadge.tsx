import React from "react";
import { TacticalGlyph } from "./TacticalGlyph";
import { 
  getTacticalCategory, 
  getTacticalColor, 
  isPriorityThreat 
} from "../../lib/tactical";

export interface TrackMarkerBadgeProps {
  objectType: string;
  objectId: string;
  speed?: number;
  altitude?: number;
  heading?: number;
  isAlert?: boolean;
  isSelected?: boolean;
  showLabel?: boolean;
  size?: number; // Base diameter (default: 64)
  isSvgChild?: boolean; // true when rendered inside an existing <svg> on CommandMap
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const TrackMarkerBadge: React.FC<TrackMarkerBadgeProps> = ({
  objectType,
  objectId,
  speed = 0,
  altitude = 0,
  heading = 0,
  isAlert = false,
  isSelected = false,
  showLabel = true,
  size = 64,
  isSvgChild = false,
  className = "",
  onClick,
}) => {
  const category = getTacticalCategory(objectType, objectId);
  const color = getTacticalColor(category, isAlert, isSelected);
  const isPriority = isPriorityThreat(category, objectType, objectId) || isAlert || isSelected;

  const radius = size / 2; // 32 for size=64
  const strokeWidth = 2.2;

  const renderBadgeContent = () => (
    <>
      {/* 1. Glow Halo: layered concentric SVG glow rings for 100% reliable SVG rendering without CSS filter quirks */}
      <circle
        r={radius + 8}
        fill="none"
        stroke={color}
        strokeWidth={8}
        opacity={0.12}
      />
      <circle
        r={radius + 4}
        fill="none"
        stroke={color}
        strokeWidth={5}
        opacity={0.25}
      />
      <circle
        r={radius + 1}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.4}
      />

      {/* 2. Priority Ring Variant: extra thin rings just outside border for high-threat/locked objects */}
      {isPriority && (
        <g>
          {/* Inner priority ring (segmented/dashed) */}
          <circle
            r={radius + 5}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            strokeDasharray="5 3"
            opacity={0.8}
          />
          {/* Outer priority ring */}
          <circle
            r={radius + 9}
            fill="none"
            stroke={color}
            strokeWidth={0.8}
            opacity={0.4}
          />
        </g>
      )}

      {/* 3. Alert Pulse Ping Ring */}
      {isAlert && (
        <circle
          r={radius + 12}
          fill="none"
          stroke="#F07576"
          strokeWidth={2}
          className="animate-ping origin-center"
          style={{ transformBox: "fill-box" }}
        />
      )}

      {/* 4. Active Selection Ring */}
      {isSelected && (
        <circle
          r={radius + 8}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeDasharray="4 3"
          className="animate-[spin_4s_linear_infinite] origin-center"
          style={{ transformBox: "fill-box" }}
        />
      )}

      {/* 5. Circular Badge Base: #0D171C at ~92% opacity with 2px solid border */}
      <circle
        r={radius}
        fill="#0D171C"
        fillOpacity={0.92}
        stroke={color}
        strokeWidth={strokeWidth}
      />

      {/* 6. Centered Tactical Icon: scaled to fill ~36px inside 64px badge so it is clearly visible and matches legend */}
      <g transform={`scale(${size / 28})`}>
        <TacticalGlyph
          objectType={objectType}
          objectId={objectId}
          color={color}
          isSvgChild={true}
        />
      </g>

      {/* 7. Kinematic Heading Arrow */}
      {speed > 0.5 && (
        <g transform={`rotate(${heading - 90})`}>
          <line
            x1={radius}
            y1={0}
            x2={radius + 10}
            y2={0}
            stroke={color}
            strokeWidth={2}
            opacity={0.9}
          />
          <polygon
            points={`${radius + 14},0 ${radius + 8},-3.5 ${radius + 8},3.5`}
            fill={color}
          />
        </g>
      )}

      {/* 8. Label: Track ID in monospace centered directly below the badge */}
      {showLabel && (
        <g transform={`translate(0, ${radius + 14})`}>
          {/* Backing pill for legibility */}
          <rect
            x="-42"
            y="-2"
            width="84"
            height="18"
            rx="4"
            fill="#071014"
            fillOpacity={0.95}
            stroke="#192830"
            strokeWidth="1"
          />
          <text
            x="0"
            y="11"
            fill={color}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.8px"
            textAnchor="middle"
            opacity={0.95}
          >
            {objectId.length > 12 ? objectId.substring(0, 11).toUpperCase() : objectId.toUpperCase()}
          </text>
          {/* Telemetry subline (speed / altitude) */}
          {(speed > 0 || altitude > 0) && (
            <text
              x="0"
              y="25"
              fill="#758890"
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              opacity={0.9}
            >
              {`SPD:${speed.toFixed(1)}${altitude > 0 ? ` ALT:${altitude.toFixed(0)}` : ""}`}
            </text>
          )}
        </g>
      )}
    </>
  );

  if (isSvgChild) {
    return (
      <g className={`select-none ${className}`} onClick={onClick}>
        {renderBadgeContent()}
      </g>
    );
  }

  // Standalone inline SVG mode (for table cells, cards, overlays)
  const padding = isPriority ? 18 : 12;
  const viewBoxSize = (radius + padding) * 2;
  const halfView = viewBoxSize / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-halfView} ${-halfView} ${viewBoxSize} ${viewBoxSize}`}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ overflow: "visible" }}
      onClick={onClick}
    >
      {renderBadgeContent()}
    </svg>
  );
};
