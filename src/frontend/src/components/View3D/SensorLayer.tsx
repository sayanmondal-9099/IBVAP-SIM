import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSimulationContext } from "../../contexts/SimulationContext";
import type { Sensor } from "../../hooks/useEnvironmentPoll";
import * as THREE from "three";

export function SensorLayer() {
  const { environment } = useSimulationContext() as any;
  const sensors = (environment?.sensors || []) as Sensor[];

  return (
    <group>
      {sensors.map((sensor) => (
        <SensorStation3D key={sensor.id} sensor={sensor} />
      ))}
    </group>
  );
}

function SensorStation3D({ sensor }: { sensor: Sensor }) {
  const dishRef = useRef<THREE.Group>(null);
  const isRadar = sensor.sensor_type.toLowerCase().includes("radar");
  const isCamera = sensor.sensor_type.toLowerCase().includes("camera");

  const isOnline = sensor.status === "online";
  const isDegraded = sensor.status === "degraded";
  const statusColor = isOnline ? "#6ED694" : isDegraded ? "#F4B65A" : "#F07576";

  useFrame((_, delta) => {
    if (dishRef.current && isOnline) {
      dishRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={[sensor.x, 0, sensor.y]}>
      {/* Base Foundation Pad */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[4.5, 5, 0.8, 8]} />
        <meshStandardMaterial color="#101E24" roughness={0.9} />
      </mesh>

      {/* Vertical Lattice Tower Mast */}
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.8, 1.4, 13, 6]} />
        <meshStandardMaterial color="#192830" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Equipment Platform */}
      <mesh position={[0, 13.6, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.5, 8]} />
        <meshStandardMaterial color="#1E2D35" />
      </mesh>

      {isRadar ? (
        /* Rotating Radar Scanner Dish */
        <group ref={dishRef} position={[0, 15.5, 0]}>
          <mesh rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[3, 1, 0.6, 16, 1, true]} />
            <meshStandardMaterial color="#2E4450" side={THREE.DoubleSide} />
          </mesh>
          {/* Radar feed horn */}
          <mesh position={[0, 0.5, 1.4]}>
            <coneGeometry args={[0.3, 1.2, 8]} />
            <meshStandardMaterial color="#48D3D2" emissive="#48D3D2" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ) : isCamera ? (
        /* Dual EO/IR Camera Housing */
        <group position={[0, 15, 0]}>
          <mesh>
            <boxGeometry args={[2.2, 1.4, 2.8]} />
            <meshStandardMaterial color="#2A3C46" />
          </mesh>
          {/* Optical Lenses */}
          <mesh position={[-0.5, 0, 1.45]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 12]} />
            <meshStandardMaterial color="#48D3D2" emissive="#48D3D2" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.5, 0, 1.45]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
            <meshStandardMaterial color="#F4B65A" emissive="#F4B65A" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ) : (
        /* Generic Sensor Mast Node */
        <mesh position={[0, 14.5, 0]}>
          <sphereGeometry args={[1.2, 12, 12]} />
          <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Sensor Beacon LED */}
      <mesh position={[0, 17, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={1.8} />
      </mesh>

      {/* Modernized HUD Label matching StatusPill */}
      <Html position={[0, 21, 0]} center className="pointer-events-none select-none">
        <div className="bg-[#071014]/90 border border-[#192830] px-2 py-1 rounded-lg shadow-xl backdrop-blur-md text-[9px] font-mono-code whitespace-nowrap flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          <span className="font-bold text-[#E8F1F4]">{sensor.id.toUpperCase()}</span>
          <span className="text-[#758890]">[{sensor.sensor_type.substring(0, 3).toUpperCase()}]</span>
        </div>
      </Html>
    </group>
  );
}
