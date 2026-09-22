import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { api } from "@/lib/api";
import { 
  Map, 
  Camera, 
  Radio, 
  Compass, 
  BellRing, 
  FolderLock, 
  Activity, 
  FileText, 
  Layers, 
  Fingerprint, 
  ChevronDown, 
  Sparkles, 
  X 
} from "lucide-react";
import { useSimulationContext } from "../contexts/SimulationContext";
import { DEFAULT_OPERATOR, type OperatorProfile } from "../types/operator";

export interface NavigationProps {
  activeAlertCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Navigation({
  activeAlertCount: propAlertCount,
  isMobileOpen = false,
  onCloseMobile,
}: NavigationProps) {
  const { newAlerts } = useSimulationContext();
  const [internalAlertCount, setInternalAlertCount] = useState<number>(0);

  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile>(() => {
    try {
      const saved = localStorage.getItem("ibvap_operator_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_OPERATOR;
  });

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

  const initials = operatorProfile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OP";

  // Keep alert count synchronized with backend & real-time socket events
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await api.get("/api/alerts");
        if (isMounted && Array.isArray(res.data)) {
          const active = res.data.filter((a: any) => a.status === "NEW" || a.status === "unacknowledged").length;
          setInternalAlertCount(active);
        }
      } catch {
        // Silently fall back to socket alerts length if endpoint unavailable
        if (isMounted) setInternalAlertCount(newAlerts.length);
      }
    };

    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [newAlerts]);

  const alertCount = propAlertCount !== undefined ? propAlertCount : internalAlertCount;

  const groups = [
    {
      title: "COMMAND",
      routes: [
        { name: "Command Map", path: "/", icon: Map },
      ],
    },
    {
      title: "SENSORS",
      routes: [
        { name: "Camera Intelligence", path: "/cameras", icon: Camera },
        { name: "Radar / Sensor View", path: "/radar", icon: Radio },
      ],
    },
    {
      title: "ANALYSIS",
      routes: [
        { name: "Live Tracks", path: "/tracks", icon: Compass },
        { name: "Alert Queue", path: "/alerts", icon: BellRing, badge: alertCount },
        { name: "Incidents", path: "/incidents", icon: FolderLock },
      ],
    },
    {
      title: "REVIEW",
      routes: [
        { name: "Human Review", path: "/human-review", icon: Fingerprint },
        { name: "Audit Trail", path: "/audit", icon: FileText },
      ],
    },
    {
      title: "SYSTEM",
      routes: [
        { name: "System Health", path: "/health", icon: Activity },
      ],
    },
    {
      title: "VISUALIZATION",
      routes: [
        { name: "3D Operational View", path: "/3d-view", icon: Layers },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-[#0D171C] text-[#E8F1F4] border-r border-[#192830] w-[230px] select-none">
      {/* Top: Active Sector Site Selector */}
      <div className="p-3 border-b border-[#192830]">
        <div className="text-[10px] uppercase font-mono-code text-[#758890] tracking-wider mb-1.5 px-1 flex items-center justify-between">
          <span>Active Sector Site</span>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="md:hidden text-[#758890] hover:text-[#E8F1F4]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-[#101E24] hover:bg-[#132128] border border-[#192830] transition-colors text-left group cursor-default"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-[#48D3D2] shrink-0 animate-pulse" />
            <div className="truncate">
              <div className="text-xs font-bold font-mono-code text-[#E8F1F4]">BOP Alpha-07</div>
              <div className="text-[10px] text-[#758890] truncate">Sector North Buffer</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#758890] group-hover:text-[#E8F1F4] shrink-0 transition-colors" />
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-4 custom-scrollbar" aria-label="Command Center Navigation">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider font-mono-code text-[#52676F]">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.routes.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#48D3D2]/40 ${
                        isActive
                          ? "bg-[#101E24] text-[#48D3D2] border border-[#48D3D2]/30 shadow-sm font-semibold"
                          : "text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24]/50 border border-transparent"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#48D3D2]" : "text-[#758890]"}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {typeof item.badge === "number" && (
                          <span
                            className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              item.badge > 0
                                ? "bg-[#F4B65A]/20 text-[#F4B65A] border border-[#F4B65A]/30"
                                : "bg-[#192830] text-[#758890]"
                            }`}
                          >
                            {item.badge.toString().padStart(2, "0")}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Simulation Mode Card + Operator Info */}
      <div className="p-3 border-t border-[#192830] space-y-3 bg-[#091317]">
        {/* Simulation Card */}
        <div className="p-2.5 rounded-lg border border-[#48D3D2]/25 bg-[#48D3D2]/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono-code text-[#48D3D2]">
            <Sparkles className="w-3 h-3" />
            <span>SIMULATION MODE</span>
          </div>
          <p className="text-[11px] text-[#758890] mt-1 leading-snug">
            All events are synthetic. No real sensors or external defence systems are connected.
          </p>
        </div>

        {/* Operator Profile Row - Tapping opens ProfileModal */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-profile-modal"))}
          title={`Operator: ${operatorProfile.name} · Click to view/edit profile`}
          aria-label="Open Operator Profile"
          className="w-full flex items-center justify-between pt-1 hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#48D3D2] rounded p-1"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#101E24] border border-[#48D3D2]/30 flex items-center justify-center text-[10px] font-bold font-mono-code text-[#48D3D2] shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#E8F1F4] truncate leading-tight">{operatorProfile.name}</div>
              <div className="text-[10px] text-[#758890] truncate leading-none">{operatorProfile.role}</div>
            </div>
          </div>
          <span className="text-[9px] font-mono-code text-[#52676F]">v1.0.0-SIM</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] z-20 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#071014]/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full w-[240px]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export const Sidebar = Navigation;

