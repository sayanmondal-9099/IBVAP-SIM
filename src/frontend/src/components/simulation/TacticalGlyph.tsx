import { 
  type TacticalObjectType, 
  getTacticalCategory, 
  getTacticalColor 
} from "../../lib/tactical";

export type { TacticalObjectType };

interface TacticalGlyphProps {
  objectType: TacticalObjectType;
  objectId?: string;
  color?: string;
  size?: number; // Used for standalone inline icon mode
  className?: string;
  isSvgChild?: boolean; // If true, renders <g> for embedding directly in an existing <svg>; if false, renders standalone <svg>
}

export function TacticalGlyph({
  objectType,
  objectId = "",
  color,
  size = 20,
  className = "",
  isSvgChild = false
}: TacticalGlyphProps) {
  const category = getTacticalCategory(objectType, objectId);
  const strokeColor = color || getTacticalColor(category);

  const renderContent = () => {
    switch (category) {
      case "drone":
        return (
          <g>
            {/* Quadcopter UAV: ✕ frame with 4 corner rotors and center white core */}
            <line x1="-6" y1="-6" x2="6" y2="6" stroke={strokeColor} strokeWidth="1.6" />
            <line x1="-6" y1="6" x2="6" y2="-6" stroke={strokeColor} strokeWidth="1.6" />
            <circle cx="-6" cy="-6" r="1.8" fill={strokeColor} />
            <circle cx="6" cy="-6" r="1.8" fill={strokeColor} />
            <circle cx="-6" cy="6" r="1.8" fill={strokeColor} />
            <circle cx="6" cy="6" r="1.8" fill={strokeColor} />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
          </g>
        );

      case "stealth":
        return (
          <g>
            {/* Stealth / Aerial Bogey: Delta chevron with center white core */}
            <polygon points="0,-8 8,5 0,1 -8,5" fill={strokeColor} />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
          </g>
        );

      case "tank":
        return (
          <g>
            {/* Heavy Tank: Dual continuous treads, turret core, and forward cannon */}
            <rect x="-8" y="-6" width="2" height="12" rx="0.5" fill={strokeColor} />
            <rect x="6" y="-6" width="2" height="12" rx="0.5" fill={strokeColor} />
            <rect x="-5" y="-5" width="10" height="10" rx="1" fill="#0A161C" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2.5" fill={strokeColor} />
            <line x1="0" y1="0" x2="0" y2="-8" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        );

      case "truck":
        return (
          <g>
            {/* Military Convoy / Truck: Cab and rear cargo enclosure */}
            <rect x="-6" y="-4" width="12" height="10" rx="1" fill="#0A161C" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="-5" y="-9" width="10" height="5" rx="1" fill={strokeColor} />
          </g>
        );

      case "infantry":
        return (
          <g>
            {/* Troop Infiltrator Squad: 3 fireteam operators in tactical wedge */}
            <circle cx="-4" cy="-3" r="2.2" fill={strokeColor} />
            <circle cx="4" cy="-3" r="2.2" fill={strokeColor} />
            <circle cx="0" cy="4" r="2.2" fill={strokeColor} />
          </g>
        );

      case "person":
        return (
          <g>
            {/* Personnel / Civilian: Center operator with dashed perimeter circle */}
            <circle cx="0" cy="0" r="3" fill={strokeColor} />
            <circle cx="0" cy="0" r="6" fill="none" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          </g>
        );

      case "bird":
        return (
          <g>
            {/* Avian Wildlife: Winged chevron arc */}
            <path d="M -6,-1 Q -3,-4 0,-1 Q 3,-4 6,-1" fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        );

      case "anomaly":
        return (
          <g>
            {/* Tactical Anomaly Diamond */}
            <polygon points="0,-8 8,0 0,8 -8,0" fill="#0A161C" stroke={strokeColor} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
        );

      default:
        return (
          <g>
            <polygon points="0,-8 8,0 0,8 -8,0" fill="#071014" stroke={strokeColor} strokeWidth="1.4" />
            <circle cx="0" cy="0" r="2" fill={strokeColor} />
          </g>
        );
    }
  };

  if (isSvgChild) {
    return <g className={className}>{renderContent()}</g>;
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="-10 -10 20 20" 
      className={`inline-block shrink-0 ${className}`}
      style={{ overflow: "visible" }}
    >
      {renderContent()}
    </svg>
  );
}
