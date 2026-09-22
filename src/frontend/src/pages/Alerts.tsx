import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useSimulationContext } from "../contexts/SimulationContext";
import { 
  BellRing, 
  Fingerprint, 
  CheckCircle2, 
  CheckCheck,
  RotateCw, 
  Filter, 
  ShieldAlert, 
  ArrowUpRight, 
  AlertTriangle,
  Search,
  X,
  ArrowUpDown,
  Volume2,
  VolumeX
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";
import { TacticalGlyph } from "../components/simulation/TacticalGlyph";

type Alert = {
  id: string;
  object_id: string;
  object_type: string;
  alert_type: string;
  status: string;
  is_synthetic: boolean;
  simulated_time: number;
  created_at: string;
  priority?: string;
  priority_band?: string;
  priority_score?: number;
  reason_code?: string;
  site_id?: string;
};

export type GroupedAlert = Alert & {
  trigger_count: number;
  latest_time: number;
  earliest_time: number;
  grouped_ids: string[];
};

function groupAlerts(alertList: Alert[], acknowledgedThreatIds: string[] = []): GroupedAlert[] {
  const sorted = [...alertList].sort((a, b) => (b.simulated_time ?? 0) - (a.simulated_time ?? 0));
  const groups: GroupedAlert[] = [];

  for (const rawAlert of sorted) {
    const isThreatAcked = acknowledgedThreatIds.includes(rawAlert.object_id) || acknowledgedThreatIds.includes(rawAlert.id);
    const effectiveStatus = (rawAlert.status === "new" || rawAlert.status === "unacknowledged") && isThreatAcked
      ? "acknowledged"
      : (rawAlert.status || "new");
    const alert: Alert = { ...rawAlert, status: effectiveStatus };

    const objId = alert.object_id || "unknown";
    const reason = alert.reason_code || alert.alert_type || "unknown";
    const time = alert.simulated_time ?? 0;

    // Check if there is an existing group for this object and reason within 45 seconds
    const existingGroup = groups.find(g => 
      (g.object_id || "unknown") === objId &&
      (g.reason_code || g.alert_type || "unknown") === reason &&
      Math.abs(g.latest_time - time) <= 45
    );

    if (existingGroup) {
      existingGroup.trigger_count += 1;
      existingGroup.grouped_ids.push(alert.id);
      if (time > existingGroup.latest_time) existingGroup.latest_time = time;
      if (time < existingGroup.earliest_time) existingGroup.earliest_time = time;
      // Only set group to "new" if the alert is genuinely unacknowledged and not silenced
      if ((alert.status === "new" || alert.status === "unacknowledged") && !isThreatAcked) {
        existingGroup.status = "new";
      }
    } else {
      groups.push({
        ...alert,
        trigger_count: 1,
        latest_time: time,
        earliest_time: time,
        grouped_ids: [alert.id]
      });
    }
  }

  return groups;
}

type StatusFilter = "all" | "active" | "acknowledged" | "review";
type PriorityFilter = "all" | "P1" | "P2" | "P3" | "P4";
type CategoryFilter = "all" | "breach" | "tripwire" | "anomaly" | "biological";
type SortOption = "newest" | "oldest" | "priority_desc" | "priority_asc" | "track_asc";

const matchesCategory = (alert: Alert, cat: CategoryFilter): boolean => {
  if (cat === "all") return true;
  const t = (alert.alert_type || "").toLowerCase();
  const r = (alert.reason_code || "").toLowerCase();
  const o = (alert.object_type || "").toLowerCase();

  if (cat === "breach") {
    return t.includes("breach") || r.includes("zone_entry") || t.includes("emergency") || r.includes("restricted");
  }
  if (cat === "tripwire") {
    return t.includes("tripwire") || r.includes("tripwire") || t.includes("fence");
  }
  if (cat === "anomaly") {
    return t.includes("anomaly") || r.includes("anomaly") || o.includes("drone") || o.includes("unknown");
  }
  if (cat === "biological") {
    return t.includes("biological") || r.includes("biological") || o.includes("bird") || o.includes("animal");
  }
  return true;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    newAlerts, 
    acknowledgeThreat, 
    acknowledgeAllThreats, 
    isSoundEnabled, 
    toggleSound, 
    isAlarmPlaying,
    acknowledgedThreatIds
  } = useSimulationContext();
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get("/api/alerts");
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await api.get("/api/alerts");
        if (isMounted && Array.isArray(res.data)) {
          setAlerts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [newAlerts]); // Re-fetch when new alerts arrive via WebSocket

  const handleAcknowledge = async (ids: string[], objectId?: string) => {
    // 1. Optimistic local update
    setAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: "acknowledged" } : a));
    if (objectId) {
      acknowledgeThreat(objectId);
    }
    try {
      await Promise.allSettled(ids.map(id => api.patch(`/api/alerts/${id}/acknowledge`)));
      fetchAlerts();
    } catch (err) {
      console.error("Failed to acknowledge", err);
    }
  };

  const handleAcknowledgeAll = async () => {
    // 1. Optimistic local update
    setAlerts(prev => prev.map(a => (a.status === "new" || a.status === "unacknowledged") ? { ...a, status: "acknowledged" } : a));
    acknowledgeAllThreats();
    try {
      await api.post("/api/alerts/acknowledge-all");
      fetchAlerts();
    } catch {
      try {
        const activeAlerts = alerts.filter(a => a.status === "new" || a.status === "unacknowledged");
        await Promise.allSettled(activeAlerts.map(a => api.patch(`/api/alerts/${a.id}/acknowledge`)));
        fetchAlerts();
      } catch (err) {
        console.error("Failed to acknowledge all", err);
      }
    }
  };

  const handleReview = (id: string) => {
    navigate(`/human-review/${id}`);
  };

  const getAlertPriority = useCallback((alert: Alert): "P1" | "P2" | "P3" | "P4" => {
    if (alert.priority_band) {
      const b = alert.priority_band.toUpperCase();
      if (b === "P1" || b === "P2" || b === "P3" || b === "P4") return b as any;
    }
    if (alert.priority) {
      const b = alert.priority.toUpperCase();
      if (b === "P1" || b === "P2" || b === "P3" || b === "P4") return b as any;
    }
    const t = (alert.alert_type || "").toLowerCase();
    const r = (alert.reason_code || "").toLowerCase();
    if (t.includes("emergency") || t.includes("multi_threat") || t.includes("breach") || r.includes("zone_entry")) return "P1";
    if (t.includes("tripwire") || t.includes("fence") || t.includes("vehicle") || t.includes("drone")) return "P2";
    if (t.includes("loitering") || t.includes("approach") || t.includes("anomal")) return "P3";
    return "P4";
  }, []);

  const getStatusVariant = (status: string): "red" | "green" | "violet" | "muted" => {
    const s = status.toLowerCase();
    if (s === "new" || s === "unacknowledged") return "red";
    if (s === "acknowledged" || s === "ack") return "green";
    if (s === "review" || s === "escalated") return "violet";
    return "muted";
  };

  // Metric counts for quick badges based on grouped alerts
  const groupedAlerts = useMemo(() => {
    return groupAlerts(alerts, acknowledgedThreatIds);
  }, [alerts, acknowledgedThreatIds]);

  const counts = useMemo(() => {
    let active = 0;
    let critical = 0;
    let p2 = 0;
    let p3 = 0;
    let p4 = 0;
    let review = 0;
    let acknowledged = 0;

    for (const a of groupedAlerts) {
      const isNew = a.status === "new" || a.status === "unacknowledged";
      const pri = getAlertPriority(a);
      if (isNew) active++;
      if (pri === "P1") critical++;
      if (pri === "P2") p2++;
      if (pri === "P3") p3++;
      if (pri === "P4") p4++;
      if (["escalated", "review"].includes(a.status)) review++;
      if (a.status === "acknowledged" || a.status === "ack") acknowledged++;
    }

    return { 
      total: alerts.length, 
      grouped: groupedAlerts.length, 
      active, 
      critical, 
      p2, 
      p3, 
      p4,
      review, 
      acknowledged 
    };
  }, [alerts.length, groupedAlerts, getAlertPriority]);

  // Combined Multi-Facet Filtering + Search + Sorting on Grouped Alerts
  const filteredAndSortedAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter
    const filtered = groupedAlerts.filter((alert) => {
      const isNew = alert.status === "new" || alert.status === "unacknowledged";
      const isAck = alert.status === "acknowledged" || alert.status === "ack";
      const isReview = ["escalated", "review"].includes(alert.status);
      const priority = getAlertPriority(alert);

      // Status Filter
      if (statusFilter === "active" && !isNew) return false;
      if (statusFilter === "acknowledged" && !isAck) return false;
      if (statusFilter === "review" && !isReview) return false;

      // Priority Filter
      if (priorityFilter !== "all" && priority !== priorityFilter) return false;

      // Category Filter
      if (!matchesCategory(alert, categoryFilter)) return false;

      // Search query filter
      if (query) {
        const matchTrack = (alert.object_id || "").toLowerCase().includes(query);
        const matchType = (alert.object_type || "").toLowerCase().includes(query);
        const matchAlert = (alert.alert_type || "").toLowerCase().includes(query);
        const matchReason = (alert.reason_code || "").toLowerCase().includes(query);
        const matchId = (alert.id || "").toLowerCase().includes(query);
        if (!matchTrack && !matchType && !matchAlert && !matchReason && !matchId) return false;
      }

      return true;
    });

    // 2. Sort
    const priorityWeight: Record<string, number> = { P1: 4, P2: 3, P3: 2, P4: 1 };

    return filtered.sort((a, b) => {
      if (sortOption === "newest") {
        return (b.latest_time ?? 0) - (a.latest_time ?? 0);
      }
      if (sortOption === "oldest") {
        return (a.latest_time ?? 0) - (b.latest_time ?? 0);
      }
      if (sortOption === "priority_desc") {
        const wa = priorityWeight[getAlertPriority(a)] || 0;
        const wb = priorityWeight[getAlertPriority(b)] || 0;
        if (wb !== wa) return wb - wa;
        return (b.latest_time ?? 0) - (a.latest_time ?? 0);
      }
      if (sortOption === "priority_asc") {
        const wa = priorityWeight[getAlertPriority(a)] || 0;
        const wb = priorityWeight[getAlertPriority(b)] || 0;
        if (wa !== wb) return wa - wb;
        return (b.latest_time ?? 0) - (a.latest_time ?? 0);
      }
      if (sortOption === "track_asc") {
        return (a.object_id || "").localeCompare(b.object_id || "");
      }
      return 0;
    });
  }, [groupedAlerts, statusFilter, priorityFilter, categoryFilter, searchQuery, sortOption, getAlertPriority]);

  const isFilterActive = statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-4 overflow-hidden font-mono-code min-h-0">
      {/* Top Quick Status Metric Cards - Interactive Filter Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setCategoryFilter("all");
            setSearchQuery("");
          }}
          className={`bg-[#0D171C] border rounded-xl p-3 flex items-center justify-between text-left transition-all cursor-pointer ${
            !isFilterActive
              ? "border-[#48D3D2] shadow-[0_0_12px_rgba(72,211,210,0.18)] bg-[#101E24]"
              : "border-[#192830] hover:border-[#48D3D2]/40"
          }`}
          aria-label="Show all queued alerts"
        >
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">TOTAL QUEUED</div>
            <div className="text-xl font-bold text-[#E8F1F4] leading-tight">
              {counts.grouped} <span className="text-[10px] font-normal text-[#758890]">({counts.total} EVTS)</span>
            </div>
          </div>
          <BellRing className={`w-4 h-4 ${!isFilterActive ? "text-[#48D3D2]" : "text-[#758890]"}`} />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => prev === "active" ? "all" : "active")}
          className={`bg-[#0D171C] border rounded-xl p-3 flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === "active"
              ? "border-[#F07576] shadow-[0_0_12px_rgba(240,117,118,0.2)] bg-[#101E24]"
              : "border-[#192830] hover:border-[#F07576]/40"
          }`}
          aria-label="Filter active new alerts"
        >
          <div>
            <div className="text-[10px] text-[#F07576] uppercase tracking-wider font-bold">ACTIVE / NEW</div>
            <div className="text-xl font-bold text-[#F07576] leading-tight">{counts.active}</div>
          </div>
          <ShieldAlert className="w-4 h-4 text-[#F07576] animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(prev => prev === "P1" ? "all" : "P1")}
          className={`bg-[#0D171C] border rounded-xl p-3 flex items-center justify-between text-left transition-all cursor-pointer ${
            priorityFilter === "P1"
              ? "border-[#F4B65A] shadow-[0_0_12px_rgba(244,182,90,0.2)] bg-[#101E24]"
              : "border-[#192830] hover:border-[#F4B65A]/40"
          }`}
          aria-label="Filter P1 critical alerts"
        >
          <div>
            <div className="text-[10px] text-[#F4B65A] uppercase tracking-wider font-bold">P1 CRITICAL</div>
            <div className="text-xl font-bold text-[#F4B65A] leading-tight">{counts.critical}</div>
          </div>
          <AlertTriangle className="w-4 h-4 text-[#F4B65A]" />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => prev === "acknowledged" ? "all" : "acknowledged")}
          className={`bg-[#0D171C] border rounded-xl p-3 flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === "acknowledged"
              ? "border-[#6ED694] shadow-[0_0_12px_rgba(110,214,148,0.2)] bg-[#101E24]"
              : "border-[#192830] hover:border-[#6ED694]/40"
          }`}
          aria-label="Filter acknowledged alerts"
        >
          <div>
            <div className="text-[10px] text-[#6ED694] uppercase tracking-wider font-bold">ACKNOWLEDGED</div>
            <div className="text-xl font-bold text-[#6ED694] leading-tight">{counts.acknowledged}</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-[#6ED694]" />
        </button>
      </div>

      {/* Main Alert Triage Table Panel */}
      <DashboardCard
        title="PRIORITY ALERT & INCIDENT QUEUE"
        subtitle={`Deterministic multi-sensor rule triggers · Showing ${filteredAndSortedAlerts.length} of ${counts.grouped} incidents (${alerts.length} total event triggers)`}
        icon={<BellRing className="w-4 h-4 text-[#F4B65A]" />}
        className="flex-1 min-h-0 flex flex-col"
        contentClassName="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Silence / ACK ALL Button */}
            {counts.active > 0 && (
              <button
                type="button"
                onClick={handleAcknowledgeAll}
                className="flex items-center gap-1.5 bg-[#6ED694]/20 hover:bg-[#6ED694]/30 text-[#6ED694] border border-[#6ED694]/50 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(110,214,148,0.2)]"
                title="Acknowledge all new alerts and silence sector alarms"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider">ACK ALL ({counts.active})</span>
              </button>
            )}

            {/* Audio Alarm Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isAlarmPlaying
                  ? "bg-[#F07576]/20 border-[#F07576] text-[#F07576] animate-pulse shadow-[0_0_10px_rgba(240,117,118,0.3)]"
                  : isSoundEnabled
                  ? "bg-[#101E24] border-[#192830] text-[#48D3D2] hover:border-[#48D3D2]/40"
                  : "bg-[#F07576]/15 border-[#F07576]/50 text-[#F07576] hover:bg-[#F07576]/25"
              }`}
              title={isSoundEnabled ? "Mute alert audio" : "Unmute alert audio"}
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#F07576]" />}
              <span className="text-[10px] uppercase tracking-wider">
                {isAlarmPlaying ? "ALARM ACTIVE" : isSoundEnabled ? "AUDIO ON" : "MUTED"}
              </span>
            </button>

            {/* Scan / Search Input */}
            <div className="flex items-center gap-1.5 bg-[#101E24] border border-[#192830] focus-within:border-[#48D3D2]/50 px-2.5 py-1 rounded-lg text-xs transition-colors">
              <Search className="w-3.5 h-3.5 text-[#758890] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SCAN TRACK OR TYPE..."
                className="bg-transparent text-[#E8F1F4] placeholder-[#52676F] text-[10px] font-mono-code uppercase outline-none w-24 sm:w-36"
                aria-label="Scan or search alert queue"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#758890] hover:text-[#E8F1F4] cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg text-xs">
              <Filter className="w-3.5 h-3.5 text-[#758890] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="bg-transparent text-[#E8F1F4] font-bold text-[10px] uppercase outline-none cursor-pointer font-mono-code"
                aria-label="Filter alerts by status"
              >
                <option value="all" className="bg-[#0D171C] text-[#E8F1F4]">STATUS: ALL</option>
                <option value="active" className="bg-[#0D171C] text-[#F07576]">STATUS: ACTIVE ({counts.active})</option>
                <option value="acknowledged" className="bg-[#0D171C] text-[#6ED694]">STATUS: ACK ({counts.acknowledged})</option>
                <option value="review" className="bg-[#0D171C] text-[#AD91FF]">STATUS: REVIEW ({counts.review})</option>
              </select>
            </div>

            {/* Priority Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="bg-transparent text-[#E8F1F4] font-bold text-[10px] uppercase outline-none cursor-pointer font-mono-code"
                aria-label="Filter alerts by priority"
              >
                <option value="all" className="bg-[#0D171C] text-[#E8F1F4]">PRIORITY: ALL</option>
                <option value="P1" className="bg-[#0D171C] text-[#F4B65A]">P1 CRITICAL ({counts.critical})</option>
                <option value="P2" className="bg-[#0D171C] text-[#F4B65A]">P2 HIGH ({counts.p2})</option>
                <option value="P3" className="bg-[#0D171C] text-[#AD91FF]">P3 MEDIUM ({counts.p3})</option>
                <option value="P4" className="bg-[#0D171C] text-[#758890]">P4 LOW ({counts.p4})</option>
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="bg-transparent text-[#E8F1F4] font-bold text-[10px] uppercase outline-none cursor-pointer font-mono-code"
                aria-label="Filter alerts by category"
              >
                <option value="all" className="bg-[#0D171C] text-[#E8F1F4]">TYPE: ALL</option>
                <option value="breach" className="bg-[#0D171C] text-[#F07576]">BREACH / ENTRY</option>
                <option value="tripwire" className="bg-[#0D171C] text-[#F4B65A]">TRIPWIRE</option>
                <option value="anomaly" className="bg-[#0D171C] text-[#48D3D2]">ANOMALY / DRONE</option>
                <option value="biological" className="bg-[#0D171C] text-[#6ED694]">BIOLOGICAL</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#101E24] border border-[#192830] px-2.5 py-1 rounded-lg text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#758890] shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-[#E8F1F4] font-bold text-[10px] uppercase outline-none cursor-pointer font-mono-code"
                aria-label="Sort alert queue"
              >
                <option value="newest" className="bg-[#0D171C] text-[#E8F1F4]">NEWEST (T-SIM ↓)</option>
                <option value="oldest" className="bg-[#0D171C] text-[#E8F1F4]">OLDEST (T-SIM ↑)</option>
                <option value="priority_desc" className="bg-[#0D171C] text-[#E8F1F4]">PRIORITY (P1 → P4)</option>
                <option value="priority_asc" className="bg-[#0D171C] text-[#E8F1F4]">PRIORITY (P4 → P1)</option>
                <option value="track_asc" className="bg-[#0D171C] text-[#E8F1F4]">TRACK ID (A → Z)</option>
              </select>
            </div>

            {/* Quick Reset Filters (shown when active) */}
            {isFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
                className="flex items-center gap-1 bg-[#101E24] hover:bg-[#132128] text-[#F4B65A] border border-[#F4B65A]/40 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Reset all filters"
              >
                <X className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">RESET</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchAlerts}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-[#101E24] hover:bg-[#132128] text-[#E8F1F4] border border-[#192830] hover:border-[#48D3D2]/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
              aria-label="Synchronize alerts with backend"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#48D3D2] ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-[10px] uppercase tracking-wider">SYNC</span>
            </button>
          </div>
        }
      >
        {/* Dedicated Visible Scrollable Container with sticky header */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full caption-bottom text-sm border-collapse font-mono-code">
            <thead className="bg-[#101E24] sticky top-0 border-b border-[#192830] shadow-sm z-10">
              <tr className="border-none text-left">
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-4 font-bold">
                  TIME (T-SIM)
                </th>
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-2 font-bold">
                  PRIORITY & TYPE
                </th>
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-2 font-bold">
                  INCITING TARGET TRACK
                </th>
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-2 font-bold">
                  STATUS
                </th>
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-2 font-bold">
                  PROVENANCE
                </th>
                <th className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 text-right px-4 font-bold">
                  OPERATOR ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192830]">
              {filteredAndSortedAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-[#758890] font-mono-code text-xs uppercase tracking-wider"
                  >
                    {isFilterActive ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Filter className="w-8 h-8 text-[#F4B65A]/60" />
                        <div>
                          <div className="text-xs font-bold text-[#E8F1F4] uppercase">No incidents match active filters</div>
                          <div className="text-[10px] text-[#758890] mt-1">
                            {[
                              statusFilter !== "all" && `Status: ${statusFilter.toUpperCase()}`,
                              priorityFilter !== "all" && `Priority: ${priorityFilter}`,
                              categoryFilter !== "all" && `Type: ${categoryFilter.toUpperCase()}`,
                              searchQuery && `Search: "${searchQuery}"`
                            ].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("all");
                            setPriorityFilter("all");
                            setCategoryFilter("all");
                            setSearchQuery("");
                          }}
                          className="px-3 py-1 bg-[#101E24] hover:bg-[#132128] border border-[#48D3D2]/40 text-[#48D3D2] rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer shadow-[0_0_8px_rgba(72,211,210,0.15)]"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-[#6ED694]/50" />
                        <span className="text-[#6ED694] font-bold">Perimeter Telemetry Nominal</span>
                        <span className="text-[10px] text-[#758890]">No active alerts recorded in sector buffer</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedAlerts.map((alert) => {
                  const priority = getAlertPriority(alert);
                  const isNew = alert.status === "new" || alert.status === "unacknowledged";
                  const canReview = ["acknowledged", "escalated", "review"].includes(alert.status);

                  return (
                    <tr
                      key={alert.id}
                      className="border-b border-[#192830] hover:bg-[#101E24] transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="font-mono-code text-xs text-[#758890] px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[#E8F1F4] font-bold">
                            T+{alert.latest_time != null ? alert.latest_time.toFixed(1) : "0.0"}s
                          </span>
                          {alert.trigger_count > 1 && (
                            <span className="text-[9px] text-[#758890]">
                              {alert.trigger_count} triggers (span {(alert.latest_time - alert.earliest_time).toFixed(1)}s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority + Alert Type */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusPill
                            label={priority}
                            variant={priority === "P1" ? "red" : priority === "P2" ? "amber" : "violet"}
                            size="xs"
                          />
                          <span className="font-mono-code text-xs font-bold text-[#E8F1F4]">
                            {alert.alert_type ? alert.alert_type.replace(/_/g, " ").toUpperCase() : "ALERT"}
                          </span>
                          {alert.trigger_count > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#F4B65A]/20 border border-[#F4B65A]/40 text-[#F4B65A] text-[9.5px] font-bold">
                              x{alert.trigger_count}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Object Track */}
                      <td className="font-mono-code text-xs text-[#E8F1F4] px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TacticalGlyph
                            objectType={alert.object_type}
                            objectId={alert.object_id}
                            size={14}
                          />
                          <span className="font-bold text-[#48D3D2]">
                            {(alert.object_id || "UNKNOWN").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <StatusPill
                          label={(alert.status || "NEW").toUpperCase()}
                          variant={getStatusVariant(alert.status || "new")}
                          size="xs"
                        />
                      </td>

                      {/* Provenance */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        {alert.is_synthetic ? (
                          <span className="text-[9px] font-mono-code tracking-wider px-1.5 py-0.5 rounded bg-[#48D3D2]/10 text-[#48D3D2] border border-[#48D3D2]/30">
                            SYNTHETIC EVIDENCE
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono-code text-[#758890]">
                            LOCAL SENSOR
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right px-4 py-3 whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          {/* ACK Button */}
                          <button
                            type="button"
                            disabled={!isNew}
                            onClick={() => handleAcknowledge(alert.grouped_ids, alert.object_id)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                              isNew
                                ? "bg-[#6ED694]/15 border-[#6ED694]/50 text-[#6ED694] hover:bg-[#6ED694]/25 shadow-[0_0_8px_rgba(110,214,148,0.2)] cursor-pointer"
                                : "bg-[#101E24]/50 border-[#192830] text-[#52676F] cursor-not-allowed opacity-50"
                            }`}
                            aria-label={`Acknowledge alert ${alert.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ACK{alert.trigger_count > 1 ? ` (${alert.trigger_count})` : ""}</span>
                          </button>

                          {/* REVIEW Button */}
                          <button
                            type="button"
                            disabled={!canReview}
                            onClick={() => handleReview(alert.id)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                              canReview
                                ? "bg-[#AD91FF]/15 border-[#AD91FF]/50 text-[#AD91FF] hover:bg-[#AD91FF]/25 shadow-[0_0_8px_rgba(173,145,255,0.2)] cursor-pointer"
                                : "bg-[#101E24]/50 border-[#192830] text-[#52676F] cursor-not-allowed opacity-50"
                            }`}
                            aria-label={`Adjudicate alert ${alert.id}`}
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>ADJUDICATE</span>
                            <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-60" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
