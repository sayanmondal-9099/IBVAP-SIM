import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Target3DModelProps {
  objectType: string;
  color: string;
  isSelected: boolean;
  speed: number;
}

export function Target3DModel({ objectType, color, isSelected, speed }: Target3DModelProps) {
  const t = objectType.toLowerCase();

  if (t.includes("drone") || t.includes("uav") || t.includes("quadcopter")) {
    return <Drone3D color={color} isSelected={isSelected} isStealth={t.includes("stealth") || t.includes("bogey")} />;
  }
  if (t.includes("tank") || t.includes("armored")) {
    return <Tank3D color={color} isSelected={isSelected} />;
  }
  if (t.includes("truck") || t.includes("convoy")) {
    return <Truck3D color={color} isSelected={isSelected} />;
  }
  if (t.includes("vehicle") || t.includes("car")) {
    return <Car3D color={color} isSelected={isSelected} />;
  }
  if (t.includes("squad") || t.includes("infantry")) {
    return <Squad3D color={color} isSelected={isSelected} />;
  }
  if (t.includes("person") || t.includes("pedestrian") || t.includes("intruder") || t.includes("walker")) {
    return <Person3D color={color} isSelected={isSelected} speed={speed} />;
  }
  if (t.includes("bird") || t.includes("biological")) {
    return <Bird3D color={color} isSelected={isSelected} />;
  }

  // Fallback: Tactical Anomaly Diamond (Octahedron with rotating gimbal)
  return <AnomalyDiamond3D color={color} isSelected={isSelected} />;
}

// 1. Quadcopter / Drone with 4 spinning rotors and optional stealth delta wings
function Drone3D({ color, isSelected, isStealth }: { color: string; isSelected: boolean; isStealth: boolean }) {
  const rotorsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (rotorsRef.current) {
      rotorsRef.current.rotation.y += delta * 24;
    }
  });

  if (isStealth) {
    // Stealth Bogey: faceted delta wing silhouette
    return (
      <group>
        {/* Main faceted swept delta wing */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[4, 5, 3]} />
          <meshStandardMaterial 
            color="#131C22" 
            roughness={0.4} 
            metalness={0.8}
            emissive={isSelected ? color : "#0A1014"} 
            emissiveIntensity={0.6} 
          />
        </mesh>
        {/* Amber stealth sensor probe */}
        <mesh position={[0, 0.4, 2]}>
          <boxGeometry args={[0.6, 0.3, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Central avionics pod */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.7, 2]} />
        <meshStandardMaterial 
          color="#162228" 
          roughness={0.5} 
          emissive={isSelected ? color : "#091216"} 
          emissiveIntensity={0.5} 
        />
      </mesh>

      {/* Cross Arms */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[4.2, 0.25, 0.4]} />
        <meshStandardMaterial color="#2B3E48" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[4.2, 0.25, 0.4]} />
        <meshStandardMaterial color="#2B3E48" />
      </mesh>

      {/* Front camera turret pod */}
      <mesh position={[0, -0.3, 1.1]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>

      {/* 4 Rotors (Spinning group) */}
      <group ref={rotorsRef}>
        {[
          [1.5, 0.35, 1.5],
          [-1.5, 0.35, 1.5],
          [1.5, 0.35, -1.5],
          [-1.5, 0.35, -1.5],
        ].map(([rx, ry, rz], idx) => (
          <group key={idx} position={[rx, ry, rz]}>
            {/* Motor hub */}
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
              <meshStandardMaterial color="#3E5460" />
            </mesh>
            {/* Translucent rotor blur disc */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[1.1, 1.1, 0.04, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 2. Heavy Armored Tank with Hull, Tracks, and Cannon
function Tank3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group position={[0, 1.2, 0]}>
      {/* Lower Chassis / Tread Bases */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 1.1, 5.8]} />
        <meshStandardMaterial color="#1B262C" roughness={0.7} />
      </mesh>
      {/* Left Tread */}
      <mesh position={[-2.1, -0.1, 0]}>
        <boxGeometry args={[0.7, 0.9, 6]} />
        <meshStandardMaterial color="#0E161A" roughness={0.9} />
      </mesh>
      {/* Right Tread */}
      <mesh position={[2.1, -0.1, 0]}>
        <boxGeometry args={[0.7, 0.9, 6]} />
        <meshStandardMaterial color="#0E161A" roughness={0.9} />
      </mesh>
      {/* Armored Sloped Upper Hull */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3.2, 0.8, 4.6]} />
        <meshStandardMaterial 
          color="#22323A" 
          emissive={isSelected ? color : "#000000"} 
          emissiveIntensity={0.4} 
        />
      </mesh>
      {/* Turret */}
      <mesh position={[0, 1.7, -0.4]}>
        <cylinderGeometry args={[1.3, 1.6, 0.9, 12]} />
        <meshStandardMaterial color="#2B3E48" />
      </mesh>
      {/* Main Cannon Barrel pointing forward */}
      <mesh position={[0, 1.7, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 3.8, 8]} />
        <meshStandardMaterial color="#1A242A" metalness={0.6} />
      </mesh>
      {/* Status LED */}
      <mesh position={[0, 2.2, -0.4]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// 3. Convoy Truck / Heavy Transport
function Truck3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group position={[0, 1.4, 0]}>
      {/* Driver Cab */}
      <mesh position={[0, 0.3, 1.8]}>
        <boxGeometry args={[3, 2.2, 2.2]} />
        <meshStandardMaterial 
          color="#1E2D34" 
          emissive={isSelected ? color : "#000000"} 
          emissiveIntensity={0.4} 
        />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.7, 2.92]}>
        <boxGeometry args={[2.4, 0.7, 0.1]} />
        <meshStandardMaterial color="#48D3D2" transparent opacity={0.6} />
      </mesh>
      {/* Rear Cargo Box */}
      <mesh position={[0, 0.6, -1.2]}>
        <boxGeometry args={[3.1, 2.6, 4.4]} />
        <meshStandardMaterial color="#141E24" roughness={0.8} />
      </mesh>
      {/* Wheels */}
      {[-1.6, 1.6].map((wx, i) =>
        [-2.2, -0.4, 1.8].map((wz, j) => (
          <mesh key={`${i}-${j}`} position={[wx, -0.7, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.65, 0.65, 0.5, 12]} />
            <meshStandardMaterial color="#0A0F12" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}

// 4. Tactical Light Vehicle / Car
function Car3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group position={[0, 0.9, 0]}>
      {/* Lower chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.8, 4.6]} />
        <meshStandardMaterial 
          color="#1A2830" 
          emissive={isSelected ? color : "#000000"} 
          emissiveIntensity={0.4} 
        />
      </mesh>
      {/* Cabin glass/roof */}
      <mesh position={[0, 0.8, -0.2]}>
        <boxGeometry args={[2.1, 0.8, 2.4]} />
        <meshStandardMaterial color="#273842" />
      </mesh>
      {/* 4 Wheels */}
      {[-1.4, 1.4].map((wx, i) =>
        [-1.3, 1.3].map((wz, j) => (
          <mesh key={`${i}-${j}`} position={[wx, -0.4, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 10]} />
            <meshStandardMaterial color="#090D10" />
          </mesh>
        ))
      )}
      {/* Headlights */}
      <mesh position={[-0.8, 0, 2.3]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#48D3D2" emissive="#48D3D2" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.8, 0, 2.3]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#48D3D2" emissive="#48D3D2" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// 5. Tactical Operative / Person
function Person3D({ color, isSelected, speed }: { color: string; isSelected: boolean; speed: number }) {
  const legRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (legRef.current && speed > 0.1) {
      const swing = Math.sin(clock.getElapsedTime() * 8) * 0.4;
      legRef.current.rotation.x = swing;
    }
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* Head / Tactical Helmet */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial 
          color="#162329" 
          emissive={isSelected ? color : "#000000"} 
          emissiveIntensity={0.5} 
        />
      </mesh>
      {/* Visor slit */}
      <mesh position={[0, 1.42, 0.42]}>
        <boxGeometry args={[0.4, 0.12, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      {/* Torso / Tactical Vest */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.9, 1.1, 0.6]} />
        <meshStandardMaterial color="#213038" roughness={0.7} />
      </mesh>
      {/* Stance Legs */}
      <group ref={legRef}>
        <mesh position={[-0.25, -0.6, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 1.2, 8]} />
          <meshStandardMaterial color="#141E24" />
        </mesh>
        <mesh position={[0.25, -0.6, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 1.2, 8]} />
          <meshStandardMaterial color="#141E24" />
        </mesh>
      </group>
    </group>
  );
}

// 6. Infantry Squad (3 tactical figures in diamond formation)
function Squad3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  return (
    <group>
      <group position={[0, 0, 1.5]}>
        <Person3D color={color} isSelected={isSelected} speed={0.5} />
      </group>
      <group position={[-1.8, 0, -1.2]}>
        <Person3D color={color} isSelected={isSelected} speed={0.5} />
      </group>
      <group position={[1.8, 0, -1.2]}>
        <Person3D color={color} isSelected={isSelected} speed={0.5} />
      </group>
    </group>
  );
}

// 7. Biological Track / Bird
function Bird3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  const wingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (wingRef.current) {
      const flap = Math.sin(clock.getElapsedTime() * 12) * 0.35;
      wingRef.current.rotation.z = flap;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 2.2, 8]} />
        <meshStandardMaterial color="#324955" emissive={isSelected ? color : "#000000"} emissiveIntensity={0.4} />
      </mesh>
      {/* Flapping swept wings */}
      <group ref={wingRef}>
        <mesh position={[-1.6, 0.1, 0]} rotation={[0, -0.2, 0.1]}>
          <boxGeometry args={[2.6, 0.05, 0.7]} />
          <meshStandardMaterial color="#4A6572" />
        </mesh>
        <mesh position={[1.6, 0.1, 0]} rotation={[0, 0.2, -0.1]}>
          <boxGeometry args={[2.6, 0.05, 0.7]} />
          <meshStandardMaterial color="#4A6572" />
        </mesh>
      </group>
    </group>
  );
}

// 8. Unknown Anomaly: Octahedron diamond with rotating gimbal ring
function AnomalyDiamond3D({ color, isSelected }: { color: string; isSelected: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.x += delta * 0.8;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <octahedronGeometry args={[2.4, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isSelected ? 1.5 : 0.8} 
          roughness={0.2}
          wireframe={false}
        />
      </mesh>
      {/* Outer Wireframe Gyroscope Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.4, 0.08, 8, 24]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
    </group>
  );
}
