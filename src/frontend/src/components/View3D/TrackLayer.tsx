import { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { Track } from "../../contexts/SimulationContext";
import type { Observation } from "../../hooks/useSimulationSocket";
import { Target3DModel } from "./Target3DModel";
import { TrackMarkerBadge } from "../simulation/TrackMarkerBadge";

interface TrackLayerProps {
  tracks: Track[];
  observations: Observation[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
}

export function TrackLayer({ tracks, observations, selectedTrackId, onSelectTrack }: TrackLayerProps) {
  // Map tracks with real-time observation telemetry and sensor provenance
  const consolidatedTargets = useMemo(() => {
    // 1. Start with fused tracks
    const targetMap = new Map<string, {
      id: string;
      object_type: string;
      x: number;
      y: number;
      altitude: number;
      speed: number;
      heading: number;
      confidence: number;
      hasCamera: boolean;
      hasRadar: boolean;
      sensorIds: Set<string>;
    }>();

    // Index observations by object_id
    for (const obs of observations) {
      const existing = targetMap.get(obs.object_id);
      const isCam = obs.sensor_type === "camera";
      const isRdr = obs.sensor_type === "radar";

      if (existing) {
        if (isCam) existing.hasCamera = true;
        if (isRdr) existing.hasRadar = true;
        if (obs.sensor_id) existing.sensorIds.add(obs.sensor_id);
        existing.confidence = Math.max(existing.confidence, obs.confidence ?? 0.8);
      } else {
        targetMap.set(obs.object_id, {
          id: obs.object_id,
          object_type: obs.object_type || "unknown",
          x: obs.x,
          y: obs.y,
          altitude: obs.altitude ?? 0,
          speed: obs.speed ?? 0,
          heading: obs.heading ?? 0,
          confidence: obs.confidence ?? 0.8,
          hasCamera: isCam,
          hasRadar: isRdr,
          sensorIds: new Set(obs.sensor_id ? [obs.sensor_id] : []),
        });
      }
    }

    // Merge tracks from context (fallback only: do NOT overwrite real-time socket positions)
    for (const trk of tracks) {
      const existing = targetMap.get(trk.id);
      if (existing) {
        if (!existing.object_type || existing.object_type === "unknown") {
          existing.object_type = trk.object_type || existing.object_type;
        }
      } else {
        targetMap.set(trk.id, {
          id: trk.id,
          object_type: trk.object_type || "unknown",
          x: trk.x,
          y: trk.y,
          altitude: trk.altitude ?? 0,
          speed: trk.speed ?? 0,
          heading: trk.heading ?? 0,
          confidence: 0.85,
          hasCamera: false,
          hasRadar: true,
          sensorIds: new Set(["fused_radar"]),
        });
      }
    }

    return Array.from(targetMap.values());
  }, [tracks, observations]);

  return (
    <group>
      {consolidatedTargets.map((target) => {
        const isSelected = selectedTrackId === target.id;
        const t = target.object_type.toLowerCase();

        // Color coding consistent with tactical HUD palette
        let color = "#48D3D2"; // Cyan default
        if (t.includes("drone") || t.includes("stealth")) color = "#AD91FF"; // Violet
        else if (t.includes("tank") || t.includes("emergency") || t.includes("breach")) color = "#F07576"; // Red
        else if (t.includes("truck") || t.includes("vehicle") || t.includes("car")) color = "#F4B65A"; // Amber
        else if (t.includes("person") || t.includes("pedestrian") || t.includes("intruder")) color = "#F4B65A"; // Amber
        else if (t.includes("bird") || t.includes("biological")) color = "#6ED694"; // Green

        // Heading rotation around Y axis in Three.js (0 deg = North = -Z)
        const headingRad = -(target.heading * (Math.PI / 180));

        return (
          <group 
            key={target.id} 
            position={[target.x, target.altitude, target.y]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTrack(target.id);
            }}
          >
            {/* Target 3D Model oriented to heading */}
            <group rotation={[0, headingRad, 0]}>
              <Target3DModel 
                objectType={target.object_type} 
                color={color} 
                isSelected={isSelected} 
                speed={target.speed} 
              />

              {/* Kinematic velocity vector arrow */}
              {target.speed > 0.5 && (
                <group position={[0, 0.5, target.speed * 1.5]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, target.speed * 2.5, 6]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                  </mesh>
                  <mesh position={[0, 0, target.speed * 1.25]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.6, 1.2, 8]} />
                    <meshBasicMaterial color={color} />
                  </mesh>
                </group>
              )}
            </group>

            {/* Selection Bounding Wireframe & Targeting Brackets */}
            {isSelected && (
              <group>
                <mesh position={[0, 1.5, 0]}>
                  <boxGeometry args={[8, 8, 8]} />
                  <meshBasicMaterial color="#48D3D2" wireframe />
                </mesh>
                {/* Pulsing targeting ring */}
                <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[6, 6.4, 32]} />
                  <meshBasicMaterial color="#48D3D2" transparent opacity={0.7} />
                </mesh>
              </group>
            )}

            {/* Camera Detection Reticle Indicator */}
            {target.hasCamera && (
              <mesh position={[0, 1.2, 0]}>
                <ringGeometry args={[4.2, 4.5, 16]} />
                <meshBasicMaterial color="#48D3D2" transparent opacity={0.4} />
              </mesh>
            )}

            {/* Radar Detection Ping Ring (Ground/Altitude echo) */}
            {target.hasRadar && (
              <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3, 3.5, 24]} />
                <meshBasicMaterial color="#F4B65A" transparent opacity={0.35} />
              </mesh>
            )}

            {/* Uncertainty Sphere Envelope */}
            <mesh position={[0, 1, 0]}>
              <sphereGeometry args={[6 + (1 - target.confidence) * 12, 12, 12]} />
              <meshBasicMaterial color={color} opacity={0.06} transparent depthWrite={false} />
            </mesh>

            {/* Drop Line to Ground Plane for Aerial Targets */}
            {target.altitude > 1 && (
              <group>
                {/* Vertical drop wire */}
                <mesh position={[0, -target.altitude / 2, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, target.altitude, 4]} />
                  <meshBasicMaterial color={color} opacity={0.4} transparent />
                </mesh>
                {/* Ground plane shadow pulse disc */}
                <mesh position={[0, -target.altitude + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[2.8, 24]} />
                  <meshBasicMaterial color={color} opacity={0.25} transparent depthWrite={false} />
                </mesh>
                {/* Ground intercept targeting ring */}
                <mesh position={[0, -target.altitude + 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[3.8, 4.2, 24]} />
                  <meshBasicMaterial color={color} opacity={0.35} transparent depthWrite={false} />
                </mesh>
                {/* Ground altitude tag */}
                <Html position={[0, -target.altitude + 0.4, 0]} center className="pointer-events-none select-none">
                  <span className="text-[7.5px] font-mono-code text-[#758890] bg-[#071014]/90 border border-[#192830] px-1 py-0.2 rounded font-bold">
                    ALT {target.altitude.toFixed(0)}m
                  </span>
                </Html>
              </group>
            )}

            {/* Modernized HUD Marker Label matching StatusPill/HudPanel */}
            <Html position={[0, 7 + (target.altitude > 20 ? 4 : 0), 0]} center className="pointer-events-none select-none">
              <div 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border backdrop-blur-md text-[10px] font-mono-code whitespace-nowrap shadow-xl transition-all ${
                  isSelected 
                    ? "bg-[#101E24] border-[#48D3D2] text-[#E8F1F4] shadow-[0_0_10px_rgba(72,211,210,0.3)]" 
                    : "bg-[#071014]/90 border-[#192830] text-[#E8F1F4]"
                }`}
              >
                <TrackMarkerBadge
                  objectType={target.object_type}
                  objectId={target.id}
                  size={18}
                  showLabel={false}
                />
                <span className="font-bold text-[#48D3D2]">
                  {target.id.length > 10 ? target.id.substring(0, 8) : target.id}
                </span>
                <span className="text-[9px] text-[#758890] uppercase font-bold">
                  [{target.object_type.substring(0, 3).toUpperCase()}]
                </span>

                {/* Provenance Badges */}
                {target.hasCamera && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-[#48D3D2]/15 text-[#48D3D2] font-bold border border-[#48D3D2]/30">
                    CAM
                  </span>
                )}
                {target.hasRadar && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-[#F4B65A]/15 text-[#F4B65A] font-bold border border-[#F4B65A]/30">
                    RDR
                  </span>
                )}
                {target.speed > 0 && (
                  <span className="text-[9px] text-[#758890]">
                    {target.speed.toFixed(0)}m/s
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
