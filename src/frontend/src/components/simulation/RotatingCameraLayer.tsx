import type { Sensor } from "../../hooks/useEnvironmentPoll";
import type { Observation } from "../../hooks/useSimulationSocket";

interface RotatingCameraLayerProps {
  sensors: Sensor[];
  observations: Observation[];
  worldToSvg: (x: number, y: number) => { sx: number; sy: number };
  speedMultiplier: number;
}

function isObsInCoverage(ox: number, oy: number, sensor: Sensor): boolean {
  if (sensor.status === "offline") return false;
  const dx = ox - sensor.x;
  const dy = oy - sensor.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > sensor.range) return false;
  if (sensor.sensor_type === "camera" && sensor.fov < 360) {
    let angleToObj = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (angleToObj < 0) angleToObj += 360;
    let diff = Math.abs(angleToObj - sensor.orientation);
    if (diff > 180) diff = 360 - diff;
    if (diff > sensor.fov / 2) return false;
  }
  return true;
}

export function RotatingCameraLayer({ sensors, observations, worldToSvg, speedMultiplier }: RotatingCameraLayerProps) {
  return (
    <g id="sensors">
      {sensors.map(s => {
        const { sx, sy } = worldToSvg(s.x, s.y);
        const isCamera = s.sensor_type === "camera" && s.fov < 360;
        const isOnline = s.status === "online";

        // Section 1.2 & 1.3: Isolated Camera Detection & Bearing Tracking
        // Only detect objects that specifically match this camera ID or are in its geometrical coverage
        const detectedObs = observations.filter(
          o => (o.sensor_id === s.id && o.sensor_type === "camera") ||
               (isCamera && o.sensor_type === "fused" && isObsInCoverage(o.x, o.y, s))
        );
        const hasDetection = isCamera && detectedObs.length > 0;

        // Primary detected target (closest to camera)
        let primaryObs: Observation | null = null;
        let targetAngleDelta = 0;

        if (hasDetection) {
          primaryObs = detectedObs.reduce((closest, curr) => {
            const dClosest = Math.hypot(closest.x - s.x, closest.y - s.y);
            const dCurr = Math.hypot(curr.x - s.x, curr.y - s.y);
            return dCurr < dClosest ? curr : closest;
          }, detectedObs[0]);

          const targetSvg = worldToSvg(primaryObs.x, primaryObs.y);
          const dxSvg = targetSvg.sx - sx;
          const dySvg = targetSvg.sy - sy;
          const angleDeg = (Math.atan2(dySvg, dxSvg) * 180) / Math.PI;
          
          // Base FOV points left (180 deg in SVG). Compute shortest angular delta (-180 to +180)
          let delta = angleDeg - 180;
          while (delta < -180) delta += 360;
          while (delta > 180) delta -= 360;
          targetAngleDelta = delta;
        }

        // Section 1.3: Strict Three-state camera color system
        // 1. Idle/scanning (no detection) — neutral/cyan (#48D3D2)
        // 2. Detecting (object in view) — yellow (#F4B65A)
        // 3. Critical proximity (object close to border, x > -90) — red (#F07576)
        let color = "#48D3D2";
        if (s.status === "offline") {
          color = "#758890";
        } else if (s.status === "degraded") {
          color = "#F4B65A";
        } else if (isCamera) {
          if (!hasDetection) {
            color = "#48D3D2"; // 1. Idle / scanning
          } else if (primaryObs && primaryObs.x > -90) {
            color = "#F07576"; // 3. Critical proximity
          } else {
            color = "#F4B65A"; // 2. Detecting
          }
        }
        
        let fovPath = null;
        if (isCamera) {
          const cAngle = Math.PI; // 180 degrees (points left towards foreign territory)
          const halfFov = (s.fov / 2) * Math.PI / 180;
          
          const startA = cAngle - halfFov;
          const endA = cAngle + halfFov;
          
          const startX = sx + s.range * Math.cos(startA);
          const startY = sy + s.range * Math.sin(startA);
          const endX = sx + s.range * Math.cos(endA);
          const endY = sy + s.range * Math.sin(endA);
          const largeArc = s.fov > 180 ? 1 : 0;
          fovPath = `M ${sx} ${sy} L ${startX} ${startY} A ${s.range} ${s.range} 0 ${largeArc} 1 ${endX} ${endY} Z`;
        }

        return (
          <g key={s.id}>
            {/* FOV Sector */}
            {fovPath && (
              hasDetection ? (
                // Detecting: orient towards target directly without 360 flip
                <g
                  style={{
                    transformOrigin: `${sx}px ${sy}px`,
                    transform: `rotate(${targetAngleDelta}deg)`,
                    transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  }}
                >
                  <path 
                    d={fovPath} 
                    fill={`${color}15`} 
                    stroke={color} 
                    strokeWidth="1.5" 
                    opacity="0.9" 
                  />
                </g>
              ) : (
                // Non-detecting: continuous idle scanning sweep unaffected by other cameras
                <g
                  style={{
                    transformOrigin: `${sx}px ${sy}px`,
                    animation: `scan-oscillation calc(4s / var(--simulation-speed, 1)) ease-in-out infinite alternate`,
                    '--simulation-speed': speedMultiplier,
                  } as React.CSSProperties}
                >
                  <path 
                    d={fovPath} 
                    fill={`${color}12`} 
                    stroke={color} 
                    strokeWidth="1.2" 
                    strokeDasharray={s.status === "degraded" ? "4 8" : "none"} 
                    opacity="0.8" 
                  />
                </g>
              )
            )}
            
            {/* Radar Radius */}
            {s.sensor_type === "radar" && (
              <g>
                <circle cx={sx} cy={sy} r={s.range} fill={`${color}08`} stroke={color} strokeWidth="0.5" opacity="0.3" />
                <circle cx={sx} cy={sy} r={s.range * 0.66} fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
                <circle cx={sx} cy={sy} r={s.range * 0.33} fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
                <circle cx={sx} cy={sy} r={s.range * 0.1} fill="none" stroke={color} strokeWidth="1" className="animate-ping origin-center" style={{ animationDuration: '3s', transformBox: 'fill-box' }} />
              </g>
            )}
            
            {/* Visual Camera/Sensor Body */}
            <g transform={`translate(${sx}, ${sy})`}>
              <rect x="-35" y="-14" width="70" height="28" fill="#0D171C" stroke={color} strokeWidth="1.2" rx="4" />
              
              <text x="0" y="-2" fill={color} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.9">
                {isCamera ? (hasDetection ? (primaryObs && primaryObs.x > -90 ? "[ CRITICAL ]" : "[ TRACKING ]") : "[ CAMERA ]") : "[ RADAR ]"}
              </text>
              
              <text x="0" y="8" fill="#E8F1F4" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {s.id.toUpperCase()}
              </text>

              {/* Status Indicator */}
              <circle cx="-25" cy="4" r="2.5" fill={color} className={hasDetection ? "animate-ping" : isOnline ? "animate-pulse" : ""} />

              {/* Turret Pointer Head showing physical orientation towards detected object */}
              {isCamera && (
                <g 
                  transform={`translate(-35, 0) rotate(${hasDetection ? targetAngleDelta : 0})`}
                  style={{
                    transformOrigin: "0px 0px",
                    transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)"
                  }}
                >
                  <polygon points="-8,-4 0,0 -8,4" fill={color} />
                </g>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}
