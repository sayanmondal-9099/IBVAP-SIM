import { Play, Square, Activity, RotateCcw, Crosshair } from "lucide-react";
import { useState } from "react";
import { useSimulationContext } from "../../contexts/SimulationContext";

const PROTOCOLS = [
  { id: "PROTOCOL-NORMAL", label: "NORMAL" },
  { id: "PROTOCOL-DRONE", label: "DRONE" },
  { id: "PROTOCOL-VEHICLE", label: "VEHICLE" },
  { id: "PROTOCOL-MULTI-THREAT", label: "MULTI-THREAT" },
  { id: "PROTOCOL-EMERGENCY", label: "EMERGENCY" },
  { id: "PROTOCOL-SENSOR-DEGRADED", label: "SENSOR DEGRADED" },
];

export function SimulationControlBar() {
  const { 
    simulationState,
    speedMultiplier, 
    setSpeedMultiplier,
    isConnected,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    anomalyEnabled,
    toggleAnomaly
  } = useSimulationContext();
  
  const [isOpen, setIsOpen] = useState(false);
  
  const scenario = simulationState?.scenario || "PROTOCOL-NORMAL";
  const isRunning = simulationState?.is_running || false;
  const isPaused = simulationState?.is_paused || false;

  const handleStartResume = () => {
    if (isRunning && isPaused) {
      resumeSimulation();
    } else {
      startSimulation(scenario, anomalyEnabled);
    }
  };

  const handleProtocolClick = (newScenario: string) => {
    startSimulation(newScenario, anomalyEnabled);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeedMultiplier(newSpeed);
  };

  return (
    <div className="absolute top-5 left-4 z-40 pointer-events-auto flex flex-col gap-2 font-mono-code select-none">
      {/* Floating Tactical Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 bg-[#0D171C]/90 backdrop-blur-md border shadow-xl px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer ${
          isOpen
            ? 'border-[#48D3D2] text-[#48D3D2] bg-[#101E24]'
            : 'border-[#192830] hover:border-[#48D3D2]/50 text-[#E8F1F4]'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isRunning && !isPaused ? 'bg-[#48D3D2] shadow-[0_0_8px_#48D3D2] animate-pulse' : 'bg-[#F4B65A]'}`} />
        <Crosshair className={`w-3.5 h-3.5 text-[#48D3D2] transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#48D3D2]' : ''}`} />
        <span>SIMULATION MODE</span>
      </button>

      {/* Expandable Tactical HUD Control Panel (Semi-transparent backdrop-blur-md to keep live map visible) */}
      <div 
        className={`bg-[#071014]/65 backdrop-blur-md border border-[#192830]/80 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.55)] w-[320px] overflow-hidden transition-all duration-300 ease-in-out origin-top-left ${
          isOpen 
            ? 'opacity-100 max-h-[480px] pointer-events-auto mt-1' 
            : 'opacity-0 max-h-0 pointer-events-none mt-0 border-transparent'
        }`}
      >
        <div className="p-3.5 flex flex-col gap-3">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#192830]/70">
            <span className="text-[9px] font-bold text-[#758890] uppercase tracking-wider">
              INJECTION PROTOCOLS
            </span>
            <span className="text-[9px] text-[#48D3D2] font-bold">
              {scenario.replace('PROTOCOL-', '')}
            </span>
          </div>

          {/* Top Row: Protocols Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {PROTOCOLS.map(p => {
              const isActive = scenario === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProtocolClick(p.id)}
                  className={`text-[9.5px] py-1.5 px-2 rounded-lg font-bold tracking-wider border transition-all cursor-pointer text-left flex items-center justify-between ${
                    isActive 
                      ? "bg-[#48D3D2]/20 border-[#48D3D2] text-[#48D3D2] shadow-[0_0_10px_rgba(72,211,210,0.2)]" 
                      : "bg-[#0D171C]/50 border-[#192830]/80 text-[#758890] hover:border-[#48D3D2]/40 hover:text-[#E8F1F4] hover:bg-[#101E24]/60"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#48D3D2] shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Primary Action Controls Row */}
          <div className="flex items-center justify-between pt-2 border-t border-[#192830]">
            
            {/* Play/Pause/Reset */}
            <div className="flex gap-1.5">
              {(!isRunning || isPaused) ? (
                <button 
                  className="h-7 px-3 flex items-center text-[9.5px] font-bold tracking-wider bg-[#48D3D2] text-[#071014] hover:bg-[#48D3D2]/90 rounded-lg disabled:opacity-40 transition-all cursor-pointer shadow-sm" 
                  onClick={handleStartResume} 
                  disabled={!isConnected}
                >
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  {isRunning && isPaused ? "RESUME" : "START"}
                </button>
              ) : (
                <button 
                  className="h-7 px-3 flex items-center text-[9.5px] font-bold tracking-wider bg-[#F4B65A]/20 text-[#F4B65A] border border-[#F4B65A]/50 hover:bg-[#F4B65A]/30 rounded-lg transition-all cursor-pointer" 
                  onClick={() => pauseSimulation()} 
                >
                  <Square className="w-3 h-3 mr-1 fill-current" />
                  PAUSE
                </button>
              )}
              
              <button 
                className="h-7 px-2.5 flex items-center text-[9.5px] font-bold tracking-wider bg-[#F07576]/10 text-[#F07576] border border-[#F07576]/30 hover:bg-[#F07576]/20 rounded-lg disabled:opacity-40 transition-all cursor-pointer" 
                onClick={() => resetSimulation()} 
                disabled={!isConnected}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                RESET
              </button>
            </div>

            {/* Speed Segmented Controls */}
            <div className="flex bg-[#0D171C] rounded-lg border border-[#192830] p-0.5 h-7 items-center">
              {[1, 2, 4, 8].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                    speedMultiplier === s 
                      ? 'bg-[#48D3D2] text-[#071014] shadow-sm' 
                      : 'text-[#758890] hover:text-[#E8F1F4]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

          </div>

          {/* Anomaly Detection Toggle */}
          <div className="pt-2 border-t border-[#192830] flex items-center justify-between">
            <div className="text-[9.5px] text-[#758890] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#48D3D2]" />
              <span>AI ANOMALY INJECTION</span>
            </div>
            <button
              onClick={() => {
                const nextState = !anomalyEnabled;
                toggleAnomaly();
                if (isRunning && !isPaused) {
                  startSimulation(scenario, nextState);
                }
              }}
              className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                anomalyEnabled 
                  ? 'bg-[#6ED694]/15 border-[#6ED694]/50 text-[#6ED694] shadow-[0_0_8px_rgba(110,214,148,0.2)]' 
                  : 'bg-[#101E24] border-[#192830] text-[#758890] hover:text-[#E8F1F4]'
              }`}
            >
              {anomalyEnabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
