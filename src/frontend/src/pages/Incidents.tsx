import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Send, 
  LayoutTemplate, 
  RotateCw, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  ShieldCheck,
  Building2,
  FolderOpen
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";

type Incident = {
  id: string;
  alert_id: string;
  status: string;
  resolution: string | null;
  resolution_notes: string | null;
  is_synthetic: boolean;
  created_at: string;
};

export default function Incidents() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/incidents");
      if (Array.isArray(res.data)) {
        setIncidents(res.data);
        if (incidentId) {
          const found = res.data.find((i: Incident) => i.id === incidentId);
          setSelectedIncident(found || null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [incidentId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/incidents");
        if (isMounted && Array.isArray(res.data)) {
          setIncidents(res.data);
          if (incidentId) {
            const found = res.data.find((i: Incident) => i.id === incidentId);
            setSelectedIncident(found || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  const handleResolve = async (resolution: string) => {
    if (!selectedIncident) return;
    setIsSubmitting(true);
    try {
      await axios.post(`http://127.0.0.1:8000/api/incidents/${selectedIncident.id}/resolve`, {
        resolution,
        notes,
      });
      setNotes("");
      navigate("/incidents");
      fetchIncidents();
    } catch (err) {
      console.error("Failed to resolve incident", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMockTransfer = async () => {
    if (!selectedIncident) return;
    setIsSubmitting(true);
    setTransferSuccess(null);
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/mock-receiver", 
        {
          incident_id: selectedIncident.id,
          alert_data: { context: "Mock operator transfer request" },
          is_synthetic: true
        },
        { headers: { "X-Simulation-ID": "operator_manual_sim" } }
      );
      setTransferSuccess("Mock telemetry packet dispatched to Base receiver (AUDIT ONLY).");
      alert("Mock transfer to Base successfully completed. (SIMULATION ONLY)");
      fetchIncidents();
    } catch (err) {
      console.error("Failed to transfer incident", err);
      alert("Failed to transfer. Ensure incident is not already transferred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openIncidentsCount = incidents.filter((i) => i.status === "open").length;
  const resolvedIncidentsCount = incidents.filter((i) => i.status !== "open").length;

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "open") return inc.status === "open";
    if (filter === "resolved") return inc.status !== "open";
    return true;
  });

  // Detailed Incident Resolution View
  if (incidentId && selectedIncident) {
    const isOpen = selectedIncident.status === "open";

    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-y-auto font-mono-code custom-scrollbar">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D171C] border border-[#192830] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate("/incidents")}
              className="flex items-center gap-1.5 bg-[#101E24] hover:bg-[#132128] text-[#758890] hover:text-[#E8F1F4] border border-[#192830] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </button>
            <div className="h-6 w-[1px] bg-[#192830]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#E8F1F4] tracking-wide uppercase">
                  INCIDENT DOSSIER RESOLUTION
                </span>
                <StatusPill 
                  label={isOpen ? "OPEN ESCALATION" : "RESOLVED"} 
                  variant={isOpen ? "red" : "green"} 
                  size="xs" 
                />
              </div>
              <div className="text-[10px] text-[#758890]">
                INCIDENT ID: {selectedIncident.id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-[#F4B65A] border border-[#F4B65A]/40 bg-[#F4B65A]/10 px-2.5 py-1 rounded-lg">
              <Radio className="w-3.5 h-3.5" />
              SIMULATION ONLY
            </span>
          </div>
        </div>

        {/* Transfer success alert banner */}
        {transferSuccess && (
          <div className="p-3 bg-[#48D3D2]/10 border border-[#48D3D2]/30 rounded-xl text-xs text-[#48D3D2] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#48D3D2] shrink-0" />
            <span>{transferSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Incident Telemetry & Linked Data (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <DashboardCard
              title="INCIDENT DOSSIER TELEMETRY"
              subtitle="Escalated from Human-in-the-Loop review queue"
              icon={<LayoutTemplate className="w-4 h-4 text-[#48D3D2]" />}
            >
              <div className="space-y-3.5 text-xs">
                <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-[#192830]">
                    <span className="text-[#758890] text-[10px] uppercase font-bold">LINKED ALERT ID:</span>
                    <span className="text-[#48D3D2] font-bold">{selectedIncident.alert_id}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#192830]">
                    <span className="text-[#758890] text-[10px] uppercase font-bold">ESCALATION TIMESTAMP:</span>
                    <span className="text-[#E8F1F4]">
                      {new Date(selectedIncident.created_at).toISOString().replace("T", " ").substring(0, 19)} UTC
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#192830]">
                    <span className="text-[#758890] text-[10px] uppercase font-bold">DATA PROVENANCE:</span>
                    <span className="text-[#6ED694] font-bold">SYNTHETIC SIMULATION</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#758890] text-[10px] uppercase font-bold">DISPOSITION STATUS:</span>
                    <StatusPill 
                      label={selectedIncident.status.toUpperCase()} 
                      variant={isOpen ? "red" : "green"} 
                      size="xs" 
                    />
                  </div>
                </div>

                {selectedIncident.resolution && (
                  <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg space-y-2">
                    <div className="text-[10px] text-[#758890] uppercase font-bold">FINAL RESOLUTION DISPOSITION:</div>
                    <div className="text-xs font-bold text-[#6ED694]">{selectedIncident.resolution}</div>
                  </div>
                )}

                {selectedIncident.resolution_notes && (
                  <div className="bg-[#071014] border border-[#192830] p-3 rounded-lg space-y-1.5">
                    <div className="text-[10px] text-[#758890] uppercase font-bold">RESOLUTION JUSTIFICATION NOTES:</div>
                    <div className="text-xs text-[#E8F1F4] italic">
                      "{selectedIncident.resolution_notes}"
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>

          {/* Right Column: Resolution Actions or Closed State (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {isOpen ? (
              <DashboardCard
                title="OPERATIONAL RESOLUTION WORKFLOW"
                subtitle="Sign-off and close incident dossier"
                icon={<AlertTriangle className="w-4 h-4 text-[#F4B65A]" />}
              >
                <div className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">
                      RESOLUTION NOTES & CLOSING JUSTIFICATION
                    </label>
                    <textarea 
                      placeholder="Enter incident closing notes, disposition justification, or tactical remarks..."
                      className="w-full min-h-[90px] bg-[#071014] border border-[#192830] focus:border-[#48D3D2] rounded-xl p-3 text-xs text-[#E8F1F4] placeholder-[#52676F] focus:outline-none transition-colors font-mono-code resize-none custom-scrollbar"
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">
                      SELECT CLOSING DISPOSITION:
                    </div>

                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve("RESOLVED — CONFIRMED SIMULATION CLASS")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-[#F07576]/40 bg-[#F07576]/10 hover:bg-[#F07576]/20 text-[#F07576] transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span className="text-xs font-bold">RESOLVED — CONFIRMED SIMULATION CLASS</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F07576]/20 border border-[#F07576]/40">CONFIRM</span>
                    </button>

                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve("RESOLVED — BENIGN / ORDINARY SIMULATION")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-[#6ED694]/40 bg-[#6ED694]/10 hover:bg-[#6ED694]/20 text-[#6ED694] transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span className="text-xs font-bold">RESOLVED — BENIGN / ORDINARY SIMULATION</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#6ED694]/20 border border-[#6ED694]/40">BENIGN</span>
                    </button>

                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve("RESOLVED — FALSE ALERT")}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-[#192830] bg-[#101E24] hover:bg-[#132128] text-[#758890] hover:text-[#E8F1F4] transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span className="text-xs font-bold">RESOLVED — FALSE ALERT</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#071014] border border-[#192830]">DISMISS</span>
                    </button>
                  </div>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-[#192830]"></div>
                    <span className="flex-shrink-0 mx-3 text-[#52676F] font-mono text-[9px] uppercase tracking-[0.2em]">or</span>
                    <div className="flex-grow border-t border-[#192830]"></div>
                  </div>

                  {/* Mock Transfer to Base */}
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleMockTransfer}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#48D3D2]/40 bg-[#48D3D2]/10 hover:bg-[#48D3D2]/20 text-[#48D3D2] text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>MOCK TRANSFER TO BASE (DISPLAY/AUDIT ONLY)</span>
                  </button>

                  <div className="p-2.5 rounded-lg border border-[#192830] bg-[#071014] text-[9px] text-[#52676F] leading-relaxed">
                    <span className="text-[#F4B65A] font-bold">SIMULATION SAFETY BOUNDARY:</span> The mock Base receiver is display and audit only. It acknowledges simulated telemetry but never triggers real-world or operational actions.
                  </div>
                </div>
              </DashboardCard>
            ) : (
              <DashboardCard
                title="INCIDENT ARCHIVED"
                subtitle="Dossier closed and cryptographically sealed"
                icon={<ShieldCheck className="w-4 h-4 text-[#6ED694]" />}
              >
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#6ED694]" />
                  <div className="text-sm font-bold text-[#E8F1F4]">INCIDENT RESOLVED & SEALED</div>
                  <p className="text-xs text-[#758890] max-w-sm">
                    This incident record has been permanently logged in the immutable SHA-256 audit ledger.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/incidents")}
                    className="mt-2 flex items-center gap-2 bg-[#101E24] hover:bg-[#132128] text-[#48D3D2] border border-[#192830] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>RETURN TO INCIDENT LEDGER</span>
                  </button>
                </div>
              </DashboardCard>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Incidents Ledger List View
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-hidden font-mono-code">
      {/* Top Incident Summary Metrics Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">TOTAL INCIDENTS</div>
            <div className="text-xl font-bold text-[#E8F1F4] leading-tight">{incidents.length} RECORDED</div>
          </div>
          <FolderOpen className="w-4 h-4 text-[#48D3D2]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">OPEN ESCALATIONS</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${openIncidentsCount > 0 ? "bg-[#F07576] animate-ping" : "bg-[#6ED694]"}`} />
              <span className={`text-xl font-bold ${openIncidentsCount > 0 ? "text-[#F07576]" : "text-[#6ED694]"} leading-tight`}>
                {openIncidentsCount} ACTIVE
              </span>
            </div>
          </div>
          <ShieldAlert className="w-4 h-4 text-[#F07576]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">RESOLVED / SEALED</div>
            <div className="text-xl font-bold text-[#6ED694] leading-tight">{resolvedIncidentsCount} CLOSED</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-[#6ED694]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">BASE INTEGRATION</div>
            <div className="text-xl font-bold text-[#48D3D2] leading-tight">MOCK RECEIVER</div>
          </div>
          <Building2 className="w-4 h-4 text-[#48D3D2]" />
        </div>
      </div>

      {/* Main Incident Dossier Ledger Panel */}
      <DashboardCard
        title="INCIDENT DOSSIER LEDGER // COMMAND ESCALATIONS"
        subtitle="Escalated breach events · Operator disposition records · Simulated base telemetry transfer"
        icon={<LayoutTemplate className="w-4 h-4 text-[#48D3D2]" />}
        className="flex-1 h-full min-h-[400px]"
        contentClassName="p-0 overflow-hidden flex flex-col h-full"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center bg-[#101E24] p-0.5 rounded-lg border border-[#192830]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  filter === "all"
                    ? "bg-[#48D3D2]/20 text-[#48D3D2] border border-[#48D3D2]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                ALL ({incidents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("open")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  filter === "open"
                    ? "bg-[#F07576]/20 text-[#F07576] border border-[#F07576]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                OPEN ({openIncidentsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("resolved")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  filter === "resolved"
                    ? "bg-[#6ED694]/20 text-[#6ED694] border border-[#6ED694]/40"
                    : "text-[#758890] hover:text-[#E8F1F4]"
                }`}
              >
                RESOLVED
              </button>
            </div>

            {/* Sync Button */}
            <button
              type="button"
              onClick={fetchIncidents}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-[#101E24] hover:bg-[#132128] text-[#E8F1F4] border border-[#192830] hover:border-[#48D3D2]/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#48D3D2] ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-[10px] uppercase tracking-wider">SYNC</span>
            </button>
          </div>
        }
      >
        <div className="overflow-auto flex-1 custom-scrollbar">
          <Table>
            <TableHeader className="bg-[#101E24] sticky top-0 border-b border-[#192830] shadow-sm z-10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 px-4">
                  INCIDENT ID
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  LINKED ALERT
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  TIMESTAMP (UTC)
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  STATUS
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  DISPOSITION / RESOLUTION
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 text-right px-4">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow className="hover:bg-transparent border-[#192830]">
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-[#758890] font-mono-code text-xs uppercase tracking-wider"
                  >
                    No escalated incident dossiers found in current view
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((inc) => (
                  <TableRow
                    key={inc.id}
                    className="border-b border-[#192830] hover:bg-[#101E24] transition-colors group"
                  >
                    {/* Incident ID */}
                    <TableCell className="font-mono-code text-xs font-bold text-[#E8F1F4] whitespace-nowrap px-4">
                      {inc.id.substring(0, 8).toUpperCase()}
                    </TableCell>

                    {/* Linked Alert */}
                    <TableCell className="font-mono-code text-xs text-[#48D3D2]">
                      {inc.alert_id.substring(0, 8).toUpperCase()}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="font-mono-code text-xs text-[#758890] whitespace-nowrap">
                      {new Date(inc.created_at).toISOString().replace("T", " ").substring(0, 19)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusPill
                        label={inc.status.toUpperCase()}
                        variant={inc.status === "open" ? "red" : "green"}
                        size="xs"
                      />
                    </TableCell>

                    {/* Resolution */}
                    <TableCell className="font-mono-code text-xs text-[#758890] max-w-[240px] truncate">
                      {inc.resolution || "PENDING OPERATOR DISPOSITION"}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right px-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        className={`font-mono-code text-[10px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                          inc.status === "open"
                            ? "bg-[#F07576]/15 hover:bg-[#F07576]/25 text-[#F07576] border-[#F07576]/40"
                            : "bg-[#101E24] hover:bg-[#132128] text-[#48D3D2] border-[#192830] hover:border-[#48D3D2]/40"
                        }`}
                      >
                        {inc.status === "open" ? "RESOLVE" : "VIEW"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>
    </div>
  );
}

