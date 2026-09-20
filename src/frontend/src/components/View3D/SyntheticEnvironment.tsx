import { Grid, Html } from "@react-three/drei";
import * as THREE from "three";

export function SyntheticEnvironment() {
  return (
    <group>
      {/* 1. Tactical Ambient & Hemispheric Lighting */}
      <ambientLight color="#0D171C" intensity={1.3} />
      <hemisphereLight groundColor="#071014" color="#102530" intensity={0.9} />

      {/* 2. Cool Cyan Key Light matching HUD palette */}
      <directionalLight 
        position={[350, 500, 250]} 
        color="#48D3D2" 
        intensity={1.6} 
        castShadow={false} 
      />

      {/* 3. Subtle Warm Amber Fill Light for depth perception */}
      <directionalLight 
        position={[-350, 350, -250]} 
        color="#F4B65A" 
        intensity={0.6} 
      />

      {/* 4. Deep Tactical Ground Base Plane */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3200, 3200]} />
        <meshStandardMaterial color="#071014" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* 5. Precision Tactical Coordinate Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={2400} 
        fadeStrength={1.5}
        cellSize={25}
        sectionSize={100}
        cellColor="#0E1B22" 
        sectionColor="#192830" 
        cellThickness={0.8}
        sectionThickness={1.6}
        position={[0, 0, 0]}
      />

      {/* 5b. Concentric Ground Range Rings (250m, 500m, 1000m) matching Radar envelope */}
      {[250, 500, 1000].map((radius) => (
        <group key={radius} position={[0, 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.7, radius + 0.7, 96]} />
            <meshBasicMaterial 
              color="#48D3D2" 
              transparent 
              opacity={radius === 500 ? 0.28 : 0.12} 
            />
          </mesh>
          {/* Range marker label etched on ground along East/West axis */}
          <Html position={[radius, 0.1, 0]} center className="pointer-events-none select-none">
            <span className="text-[8px] font-mono-code text-[#48D3D2]/60 font-bold px-1 py-0.2 rounded bg-[#071014]/60 border border-[#48D3D2]/20">
              {radius}m
            </span>
          </Html>
        </group>
      ))}

      {/* 6. Border Security Barrier Line at X = 0 (International Boundary) */}
      <group position={[0, 0, 0]}>
        {/* Glowing border wire on ground */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.9, 0.4, 2400]} />
          <meshStandardMaterial 
            color="#48D3D2" 
            emissive="#48D3D2" 
            emissiveIntensity={1.0} 
            transparent 
            opacity={0.9} 
          />
        </mesh>

        {/* Translucent Perimeter Laser Barrier Curtain spanning fence line */}
        <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1800, 8]} />
          <meshBasicMaterial 
            color="#48D3D2" 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </mesh>

        {/* Tactical Border Fence Posts with LED Beacons every 100m */}
        {[-800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700, 800].map((z) => (
          <group key={z} position={[0, 0, z]}>
            {/* Post pillar */}
            <mesh position={[0, 4, 0]}>
              <cylinderGeometry args={[0.35, 0.45, 8, 8]} />
              <meshStandardMaterial color="#1E2C33" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Post top cyan LED emitter */}
            <mesh position={[0, 8.2, 0]}>
              <sphereGeometry args={[0.5, 10, 10]} />
              <meshStandardMaterial 
                color="#48D3D2" 
                emissive="#48D3D2" 
                emissiveIntensity={2.0} 
              />
            </mesh>
          </group>
        ))}

        {/* 3D World Cardinal Ground Beacons */}
        <Html position={[0, 1.2, -880]} center className="pointer-events-none select-none">
          <div className="px-2.5 py-0.5 rounded-lg bg-[#071014]/90 border border-[#F07576]/60 text-[#F07576] text-[9px] font-mono-code font-bold tracking-widest shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span>▲</span>
            <span>NORTH · SECTOR ALPHA</span>
          </div>
        </Html>
        <Html position={[0, 1.2, 880]} center className="pointer-events-none select-none">
          <div className="px-2.5 py-0.5 rounded-lg bg-[#071014]/90 border border-[#48D3D2]/60 text-[#48D3D2] text-[9px] font-mono-code font-bold tracking-widest shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span>▼</span>
            <span>SOUTH · SECTOR DELTA</span>
          </div>
        </Html>
      </group>
    </group>
  );
}
