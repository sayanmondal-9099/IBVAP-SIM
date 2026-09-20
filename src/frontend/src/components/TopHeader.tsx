import { useState, useEffect, useRef } from "react";

import { useSimulationContext } from "../contexts/SimulationContext";
import { 
  Settings, 
  Play, 
  Pause, 
  Menu, 
  Shield, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  WifiOff, 
  Volume2, 
  VolumeX,
  MapPin,
  Clock,
  Lock,
  Edit3,
  Radio
} from "lucide-react";
import { SensorRing } from "./primitives/SensorRing";
import { ProfileModal } from "./ProfileModal";
import { DEFAULT_OPERATOR, type OperatorProfile } from "../types/operator";

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
}

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const { simulationState, isConnected, pauseSimulation, resumeSimulation, resetSimulation, isSoundEnabled, toggleSound } = useSimulationContext();
  const isRunning = simulationState?.is_running ?? false;
  const isPaused = simulationState?.is_paused ?? false;

  const [timeStr, setTimeStr] = useState<string>("16 SEP 2026 · 10:32:14 IST");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile>(() => {
    try {
      const saved = localStorage.getItem("ibvap_operator_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_OPERATOR;
  });

  const handleSaveProfile = (updated: OperatorProfile) => {
    setOperatorProfile(updated);
    try {
      localStorage.setItem("ibvap_operator_profile", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem("ibvap_operator_profile");
        if (saved) setOperatorProfile(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleOpenProfile = () => {
      setIsProfileDropdownOpen(false);
      setIsProfileOpen(true);
    };
    window.addEventListener("open-profile-modal", handleOpenProfile);
    return () => window.removeEventListener("open-profile-modal", handleOpenProfile);
  }, []);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initials = operatorProfile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OP";

  useEffect(() => {
    // Dynamic simulated time updates with IST notation
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const day = pad(now.getDate());
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setTimeStr(`${day} ${month} ${year} · ${time} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulation = async () => {
    if (!isConnected) return;
    if (isRunning && !isPaused) {
      await pauseSimulation();
    } else {
      await resumeSimulation();
    }
  };

  const handleConfirmReset = async () => {
    await resetSimulation();
    setIsResetConfirmOpen(false);
  };

  return (
    <>
      <header className="h-14 border-b border-[#192830] bg-[#0D171C] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 rounded-md text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] transition-colors focus:outline-none focus:ring-1 focus:ring-[#48D3D2]"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {/* Brand Mark: Visual Sensor-Ring Motif */}
            <SensorRing size="md" accentColor="cyan" />

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wider text-[#E8F1F4] font-mono-code">
                  IBVAP—SIM
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30">
                  PROTOTYPE
                </span>
              </div>
              <div className="hidden lg:block text-[11px] text-[#758890] leading-none">
                Intelligent Border Video Analytics Platform
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live status + Simulated clock */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#071014] px-3 py-1.5 rounded-md border border-[#192830]">
          <button
            type="button"
            onClick={handleToggleSimulation}
            disabled={!isConnected}
            title={
              !isConnected
                ? "Simulation backend offline"
                : isRunning && !isPaused
                ? "Click to pause synthetic simulation"
                : "Click to resume synthetic simulation"
            }
            className="flex items-center gap-2 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#48D3D2]/40 rounded px-1"
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                !isConnected
                  ? "bg-[#F07576] animate-pulse"
                  : isRunning && !isPaused
                  ? "bg-[#48D3D2] shadow-[0_0_8px_#48D3D2]"
                  : "bg-[#F4B65A]"
              }`}
            />
            <span className="text-[11px] font-bold tracking-wider font-mono-code text-[#E8F1F4] group-hover:text-[#48D3D2] transition-colors flex items-center gap-1">
              {!isConnected
                ? "OFFLINE"
                : isRunning && !isPaused
                ? "SIMULATION RUNNING"
                : isRunning && isPaused
                ? "SIMULATION PAUSED"
                : "SIMULATION STANDBY"}
              {isConnected && isRunning && (
                !isPaused ? (
                  <Pause className="w-3 h-3 text-[#758890] group-hover:text-[#48D3D2]" />
                ) : (
                  <Play className="w-3 h-3 text-[#F4B65A] fill-current" />
                )
              )}
            </span>
          </button>

          <span className="text-[#192830] hidden sm:inline">|</span>

          <span className="hidden sm:inline-block text-[11px] font-mono-code text-[#758890]">
            {timeStr}
          </span>
        </div>

        {/* Right: Sound toggle + Settings dropdown + Operator avatar */}
        <div className="flex items-center gap-2.5 relative">
          {/* Master Sound On/Off Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={isSoundEnabled ? "Alert audio enabled (Click to mute)" : "Alert audio muted (Click to unmute)"}
            aria-label={isSoundEnabled ? "Mute alert audio" : "Unmute alert audio"}
            className={`p-2 rounded-md transition-colors border focus:outline-none focus:ring-1 focus:ring-[#48D3D2] ${
              isSoundEnabled
                ? "text-[#48D3D2] hover:text-[#5fe4e3] hover:bg-[#101E24] border-[#48D3D2]/30 bg-[#48D3D2]/5"
                : "text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] border-transparent"
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Gear Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen((prev) => !prev);
                setIsProfileDropdownOpen(false);
              }}
              aria-label="Settings & Prototype Controls"
              aria-expanded={isSettingsOpen}
              className={`p-2 rounded-md transition-colors border focus:outline-none focus:ring-1 focus:ring-[#48D3D2] cursor-pointer ${
                isSettingsOpen
                  ? "text-[#48D3D2] bg-[#101E24] border-[#48D3D2]/40"
                  : "text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] border-transparent hover:border-[#192830]"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#192830] bg-[#0D171C] p-2 shadow-2xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase font-mono-code text-[#758890] border-b border-[#192830]">
                  Simulation Controls
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsSafetyModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs text-[#E8F1F4] hover:bg-[#101E24] rounded flex items-center gap-2 mt-1 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#F4B65A]" />
                  <span>Safety & Boundary Notice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsResetConfirmOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs text-[#F07576] hover:bg-[#F07576]/10 rounded flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Simulation Data</span>
                </button>
              </div>
            )}
          </div>

          {/* Operator Badge - Tapping opens Operator Profile Dropdown Panel */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileDropdownOpen((prev) => !prev);
                setIsSettingsOpen(false);
              }}
              title={`Operator: ${operatorProfile.name} (${operatorProfile.role}) · Click to open operator profile`}
              aria-label="Open Operator Profile"
              aria-expanded={isProfileDropdownOpen}
              className={`flex items-center gap-2 pl-2 border-l border-[#192830] hover:opacity-90 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#48D3D2] rounded py-1 ${
                isProfileDropdownOpen ? "bg-[#101E24]/60" : ""
              }`}
            >
              <div className={`w-7 h-7 rounded-full bg-[#101E24] border flex items-center justify-center text-[11px] font-bold font-mono-code text-[#48D3D2] transition-colors shadow-sm ${
                isProfileDropdownOpen ? "border-[#48D3D2] shadow-[0_0_8px_rgba(72,211,210,0.4)]" : "border-[#48D3D2]/40 group-hover:border-[#48D3D2]"
              }`}>
                {initials}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold leading-tight text-[#E8F1F4] group-hover:text-[#48D3D2] transition-colors">
                  {operatorProfile.name}
                </div>
                <div className="text-[10px] text-[#758890] leading-none">
                  {operatorProfile.role}
                </div>
              </div>
            </button>

            {/* Operator Profile Dropdown Panel (styled consistent with Settings dropdown) */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-lg border border-[#192830] bg-[#0D171C] p-2.5 shadow-2xl z-50 font-mono-code">
                {/* Profile Header */}
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase font-mono-code text-[#758890] border-b border-[#192830] flex items-center justify-between">
                  <span>Operator Profile</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30">
                    ACTIVE TAC-OPS
                  </span>
                </div>

                {/* Operator Identity Banner */}
                <div className="flex items-center gap-3 p-2.5 my-1.5 rounded-lg bg-[#101E24] border border-[#192830]">
                  <div className="w-9 h-9 rounded-full bg-[#071014] border border-[#48D3D2]/50 flex items-center justify-center text-xs font-bold text-[#48D3D2] shadow-[0_0_8px_rgba(72,211,210,0.2)] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#E8F1F4] truncate">{operatorProfile.name}</div>
                    <div className="text-[10px] text-[#758890] truncate">{operatorProfile.role} · {operatorProfile.badgeId}</div>
                  </div>
                </div>

                {/* Operator Metadata Details */}
                <div className="space-y-1 my-2 text-[10px]">
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-[#071014]/60 border border-[#192830]/60">
                    <span className="text-[#758890] flex items-center gap-1.5 font-bold">
                      <MapPin className="w-3 h-3 text-[#6ED694]" /> SECTOR
                    </span>
                    <span className="text-[#E8F1F4] font-semibold truncate max-w-[170px]">
                      {operatorProfile.sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-[#071014]/60 border border-[#192830]/60">
                    <span className="text-[#758890] flex items-center gap-1.5 font-bold">
                      <Clock className="w-3 h-3 text-[#AD91FF]" /> SHIFT
                    </span>
                    <span className="text-[#E8F1F4] font-semibold truncate max-w-[170px]">
                      {operatorProfile.shift}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-[#071014]/60 border border-[#192830]/60">
                    <span className="text-[#758890] flex items-center gap-1.5 font-bold">
                      <Lock className="w-3 h-3 text-[#48D3D2]" /> CLEARANCE
                    </span>
                    <span className="text-[#48D3D2] font-semibold truncate max-w-[170px]">
                      {operatorProfile.clearance}
                    </span>
                  </div>
                </div>

                {/* Simulation Notice */}
                <div className="px-2 py-1.5 rounded bg-[#071014] border border-[#192830] text-[9px] text-[#758890] flex items-start gap-1.5 leading-snug my-1.5">
                  <Radio className="w-3 h-3 text-[#F4B65A] shrink-0 mt-0.5" />
                  <span>SIMULATION ONLY · Synthetic identity in local session.</span>
                </div>

                {/* Dropdown Action Buttons */}
                <div className="pt-1.5 border-t border-[#192830] space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-[#E8F1F4] hover:bg-[#101E24] hover:text-[#48D3D2] rounded flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#48D3D2]" />
                    <span>View / Edit Full Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsSafetyModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-[#E8F1F4] hover:bg-[#101E24] rounded flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F4B65A]" />
                    <span>Safety & Boundary Notice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Safety & Boundary Modal */}
      {isSafetyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="safety-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071014]/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl rounded-xl border border-[#192830] bg-[#0D171C] p-6 shadow-2xl transition-all">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#192830]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F4B65A]/10 text-[#F4B65A]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="safety-modal-title" className="text-base font-bold text-[#E8F1F4]">
                    Safety Boundary & Prototype Architecture
                  </h2>
                  <p className="text-xs text-[#758890] font-mono-code mt-0.5">
                    IBVAP—SIM · NON-OPERATIONAL DEMONSTRATION ENVIRONMENT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSafetyModalOpen(false)}
                aria-label="Close safety modal"
                className="p-1 rounded-md text-[#758890] hover:text-[#E8F1F4] hover:bg-[#132128] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice Banner */}
            <div className="mt-4 p-3.5 rounded-lg border border-[#F4B65A]/30 bg-[#F4B65A]/10 text-xs text-[#F4B65A] font-mono-code leading-relaxed">
              SIMULATION ONLY — All tracks, alerts, radar returns, people, vehicles, aerial objects,
              and transfers are synthetic. No real sensors or external defence systems are connected.
            </div>

            {/* Architecture Details */}
            <div className="mt-4 space-y-3 text-xs text-[#758890] leading-relaxed">
              <div className="p-3 rounded-lg bg-[#101E24] border border-[#192830] flex items-start gap-3">
                <Cpu className="w-4 h-4 text-[#48D3D2] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#E8F1F4] font-mono-code">
                    Edge Processing Architecture
                  </div>
                  <div>
                    Simulates edge-level fusion of optical, thermal, and FMCW radar sensors with deterministic tripwire rules.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#101E24] border border-[#192830] flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-[#AD91FF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#E8F1F4] font-mono-code">
                    Append-Only Cryptographic Audit Log
                  </div>
                  <div>
                    Simulated SHA-256 hash chaining guarantees non-repudiation of operator triage and acknowledgment records.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#101E24] border border-[#192830] flex items-start gap-3">
                <WifiOff className="w-4 h-4 text-[#6ED694] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#E8F1F4] font-mono-code">
                    Local Ledger & Human-in-the-Loop
                  </div>
                  <div>
                    No firing, interception, or autonomous response is implemented. Human operator adjudication is mandatory.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#192830] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSafetyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#48D3D2] hover:bg-[#5fe4e3] text-xs font-bold font-mono-code text-[#071014] transition-colors"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071014]/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-xl border border-[#192830] bg-[#0D171C] p-5 shadow-2xl">
            <h3 className="text-sm font-bold font-mono-code text-[#E8F1F4] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#F07576]" />
              <span>Reset Simulation State?</span>
            </h3>
            <p className="text-xs text-[#758890] mt-2 leading-relaxed">
              This will clear currently active synthetic tracks and restore simulation tick parameters to their initial baseline.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5 font-mono-code text-xs">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#192830] text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1.5 rounded-lg bg-[#F07576] hover:bg-[#ff8a8b] font-bold text-[#071014] transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={operatorProfile}
        onSaveProfile={handleSaveProfile}
      />
    </>
  );
}

export const Topbar = TopHeader;

