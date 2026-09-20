import { Html } from "@react-three/drei";
import { useSimulationContext } from "../../contexts/SimulationContext";
import type { Zone } from "../../hooks/useEnvironmentPoll";
import * as THREE from "three";
import { useMemo } from "react";

export function ZoneLayer() {
  const { environment } = useSimulationContext() as any;
  const zones = (environment?.zones || []) as Zone[];

  return (
    <group>
      {zones.map((zone) => (
        <ZoneMesh key={zone.id} zone={zone} />
      ))}
    </group>
  );
}

function ZoneMesh({ zone }: { zone: any }) {
  const isRestricted = zone.zone_type === 'restricted';
  const color = isRestricted ? "#ef4444" : "#eab308";
  
  const geometry = useMemo(() => {
    if (zone.points && zone.points.length >= 3) {
      const shape = new THREE.Shape();
      shape.moveTo(zone.points[0][0], zone.points[0][1]);
      for (let i = 1; i < zone.points.length; i++) {
        shape.lineTo(zone.points[i][0], zone.points[i][1]);
      }
      shape.closePath();
      return new THREE.ShapeGeometry(shape);
    } else if (zone.center && zone.radius) {
      return new THREE.CircleGeometry(zone.radius, 32);
    }
    return null;
  }, [zone]);

  if (!geometry) return null;

  // We have x,y (2D) points which translate to x,z (3D) in ThreeJS
  // The shape geometry is created in XY plane, so we rotate it to lay flat on XZ plane
  
  // Calculate center for HTML label
  let cx = 0, cy = 0;
  if (zone.center) {
    cx = zone.center[0];
    cy = zone.center[1];
  } else if (zone.points) {
    cx = zone.points.reduce((sum: number, p: any) => sum + p[0], 0) / zone.points.length;
    cy = zone.points.reduce((sum: number, p: any) => sum + p[1], 0) / zone.points.length;
  }

  return (
    <group position={[0, 0.5, 0]}>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={color} opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* Edge highlight */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={color} opacity={0.5} transparent />
      </lineSegments>

      <Html position={[cx, 0, cy]} center className="pointer-events-none">
        <div className={`font-bold tracking-widest text-[10px] uppercase ${isRestricted ? 'text-red-500/80' : 'text-yellow-500/80'}`}>
          {zone.id}
        </div>
      </Html>
    </group>
  );
}
