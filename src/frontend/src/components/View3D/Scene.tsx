import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SyntheticEnvironment } from "./SyntheticEnvironment";
import { SensorLayer } from "./SensorLayer";
import { ZoneLayer } from "./ZoneLayer";
import { TrackLayer } from "./TrackLayer";
import { useSimulationContext } from "../../contexts/SimulationContext";

interface SceneProps {
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onHeadingChange?: (deg: number) => void;
  onPitchChange?: (deg: number) => void;
  resetNorthTrigger?: number;
  presetTrigger?: { type: "ortho" | "iso" | "perimeter" | "north"; time: number } | null;
}

function CameraTelemetryTracker({ 
  onHeadingChange, 
  onPitchChange 
}: { 
  onHeadingChange?: (deg: number) => void; 
  onPitchChange?: (deg: number) => void;
}) {
  const lastDegRef = useRef<number>(-1);
  const lastPitchRef = useRef<number>(-999);

  useFrame(({ camera }) => {
    // 1. Azimuth Heading in XZ plane
    const angleRad = Math.atan2(camera.position.x, camera.position.z);
    let deg = Math.round((angleRad * 180) / Math.PI);
    if (deg < 0) deg += 360;
    if (Math.abs(deg - lastDegRef.current) >= 1 && onHeadingChange) {
      lastDegRef.current = deg;
      onHeadingChange(deg);
    }

    // 2. Camera pitch (elevation angle relative to horizontal ground)
    const horizDist = Math.hypot(camera.position.x, camera.position.z);
    const pitchRad = Math.atan2(camera.position.y, horizDist);
    const pitchDeg = -Math.round((pitchRad * 180) / Math.PI);
    if (Math.abs(pitchDeg - lastPitchRef.current) >= 1 && onPitchChange) {
      lastPitchRef.current = pitchDeg;
      onPitchChange(pitchDeg);
    }
  });

  return null;
}

export function Scene({ 
  selectedTrackId, 
  onSelectTrack, 
  onHeadingChange,
  onPitchChange,
  resetNorthTrigger,
  presetTrigger
}: SceneProps) {
  const { tracks, observations } = useSimulationContext();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Smoothly reset camera to North when trigger fires
  useEffect(() => {
    if (resetNorthTrigger && resetNorthTrigger > 0 && controlsRef.current) {
      const controls = controlsRef.current;
      controls.reset();
      controls.object.position.set(0, 450, 750);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [resetNorthTrigger]);

  // Handle Quick Camera Viewport Presets
  useEffect(() => {
    if (!presetTrigger || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;

    if (presetTrigger.type === "north") {
      controls.reset();
      camera.position.set(0, 450, 750);
      controls.target.set(0, 0, 0);
    } else if (presetTrigger.type === "ortho") {
      camera.position.set(0, 950, 0.01);
      controls.target.set(0, 0, 0);
    } else if (presetTrigger.type === "iso") {
      camera.position.set(300, 450, 600);
      controls.target.set(0, 0, 0);
    } else if (presetTrigger.type === "perimeter") {
      camera.position.set(400, 75, 0);
      controls.target.set(-50, 10, 0);
    }
    controls.update();
  }, [presetTrigger]);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        enableDamping
        dampingFactor={0.05}
        minDistance={40} 
        maxDistance={1800} 
        maxPolarAngle={Math.PI / 2 - 0.02}
        rotateSpeed={0.7}
        panSpeed={0.7}
        zoomSpeed={0.9}
      />

      <CameraTelemetryTracker onHeadingChange={onHeadingChange} onPitchChange={onPitchChange} />
      
      <SyntheticEnvironment />
      <ZoneLayer />
      <SensorLayer />
      <TrackLayer 
        tracks={tracks} 
        observations={observations} 
        selectedTrackId={selectedTrackId}
        onSelectTrack={onSelectTrack}
      />
    </>
  );
}
