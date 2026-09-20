import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  UserCheck, 
  Target, 
  Activity, 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Radio,
  FileText
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";

interface AlertDetail {
  id: string;
  object_id: string;
  object_type: string;
  alert_type: string;
  simulated_time: number;
  status: string;
  is_synthetic: boolean;
  priority?: string;
  created_at?: string;
  review_decision?: string | null;
  review_notes?: string | null;
  reviewer_id?: string | null;
}

export default function HumanReview() {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDecision, setActiveDecision] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(alertId));

  useEffect(() => {
    let isMounted = true;
    if (!alertId) return;

    axios
      .get("http://127.0.0.1:8000/api/alerts")
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const found = res.data.find((a: AlertDetail) => a.id === alertId);
          setAlert(found || null);
        }
      })
      .catch((err) => {
        console.error("Failed to load alert for review", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [alertId]);

  const handleDecision = async (decision: string) => {
    if (!alertId) return;
    setIsSubmitting(true);
    setActiveDecision(decision);
    try {
      await axios.post(`http://127.0.0.1:8000/api/alerts/${alertId}/review`, {
        decision,
        notes,
        reviewer_id: "operator_01",
      });

      // If confirmed, escalate to incident automatically based on workflow requirements
      if (decision === "CONFIRMED SIMULATION CLASS") {
        await axios.post(`http://127.0.0.1:8000/api/alerts/${alertId}/escalate`);
      }

      navigate("/alerts");
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setIsSubmitting(false);
      setActiveDecision(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#071014] text-[#E8F1F4] gap-4 font-mono-code select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#192830] border-t-[#48D3D2] animate-spin" />
        <div className="text-xs font-bold text-[#48D3D2] tracking-widest animate-pulse">
          INITIALIZING HITL ADJUDICATION SESSION...
        </div>
        <div className="text-[10px] text-[#758890] uppercase tracking-wider">
          Retrieving synthetic alert dossier & sensor provenance
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#071014] text-[#E8F1F4] gap-4 font-mono-code select-none p-6">
        <div className="p-4 rounded-xl border border-[#F07576]/30 bg-[#F07576]/10 text-[#F07576] flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <div className="text-sm font-bold">ALERT DOSSIER NOT FOUND</div>
            <div className="text-xs text-[#758890]">
              Target alert ID `{alertId}` does not exist or has expired from cache.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="flex items-center gap-2 bg-[#101E24] hover:bg-[#132128] text-[#48D3D2] border border-[#192830] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO ACTIVE ALERTS</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-y-auto font-mono-code custom-scrollbar">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D171C] border border-[#192830] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/alerts")}
            className="flex items-center gap-1.5 bg-[#101E24] hover:bg-[#132128] text-[#758890] hover:text-[#E8F1F4] border border-[#192830] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </button>
          <div className="h-6 w-[1px] bg-[#192830]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#E8F1F4] tracking-wide uppercase">
                HUMAN-IN-THE-LOOP ADJUDICATION // HITL
              </span>
              <StatusPill label="OPERATOR REVIEW" variant="violet" size="xs" />
            </div>
            <div className="text-[10px] text-[#758890]">
              DOSSIER ID: {alert.id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-[#F4B65A] border border-[#F4B65A]/40 bg-[#F4B65A]/10 px-2.5 py-1 rounded-lg">
            <Radio className="w-3.5 h-3.5" />
            SIMULATION ONLY
          </span>
          <span className="hidden sm:flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-[#6ED694] border border-[#6ED694]/40 bg-[#6ED694]/10 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            AUDIT LOGGED
          </span>
        </div>
      </div>

      {/* Main Review Section: Dossier & Evidence (Left) + Operator Decision (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Evidence & Telemetry Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Inciting Alert Telemetry Card */}
          <DashboardCard
            title="INCITING ALERT TELEMETRY & PROVENANCE"
            subtitle="Deterministic synthetic sensor capture tied to cryptographic audit chain"
            icon={<Target className="w-4 h-4 text-[#48D3D2]" />}
          >
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#101E24] border border-[#192830] p-2.5 rounded-lg">
                  <div className="text-[9px] text-[#758890] uppercase font-bold">ALERT TYPE</div>
                  <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">{alert.alert_type.toUpperCase()}</div>
                </div>

                <div className="bg-[#101E24] border border-[#192830] p-2.5 rounded-lg">
                  <div className="text-[9px] text-[#758890] uppercase font-bold">TARGET CLASS</div>
                  <div className="text-xs font-bold text-[#48D3D2] mt-0.5">{alert.object_type.toUpperCase()}</div>
                </div>

                <div className="bg-[#101E24] border border-[#192830] p-2.5 rounded-lg">
                  <div className="text-[9px] text-[#758890] uppercase font-bold">SIMULATION TIME</div>
                  <div className="text-xs font-bold text-[#F4B65A] mt-0.5">T+{alert.simulated_time.toFixed(2)}s</div>
                </div>
              </div>

              <div className="bg-[#071014] border border-[#192830] p-3 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#758890] text-[10px] uppercase font-bold">PROVENANCE OBJECT ID</span>
                  <span className="text-[#AD91FF] font-bold">{alert.object_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#758890] text-[10px] uppercase font-bold">SYNTHETIC VECTOR FLAG</span>
                  <span className="text-[#6ED694] font-bold">TRUE (MOCK TEST SCENARIO)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#758890] text-[10px] uppercase font-bold">CURRENT STATUS</span>
                  <StatusPill 
                    label={alert.status.toUpperCase()} 
                    variant={alert.status === "new" ? "red" : "amber"} 
                    size="xs" 
                  />
                </div>
              </div>

              {/* Confidence & Uncertainty Breakdown */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#758890] uppercase font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#48D3D2]" />
                    DETECTION CONFIDENCE RATING
                  </span>
                  <span className="text-[#48D3D2] font-bold font-mono-code">92.4%</span>
                </div>
                <div className="w-full h-2 bg-[#101E24] border border-[#192830] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#48D3D2] to-[#6ED694] rounded-full"
                    style={{ width: "92.4%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#52676F]">
                  <span>UNCERTAINTY: ±0.076</span>
                  <span>DATA QUALITY: OPTIMAL (0.95)</span>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Synthetic Sensor Evidence Stage */}
          <DashboardCard
            title="SYNTHETIC SENSOR FUSION EVIDENCE"
            subtitle="Multi-spectrum edge telemetry reconstruction at incident timestamp"
            icon={<FileText className="w-4 h-4 text-[#AD91FF]" />}
          >
            <div className="relative w-full h-48 sm:h-56 bg-[#050B0E] rounded-xl overflow-hidden border border-[#192830] flex items-center justify-center">
              {/* Scanlines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25 z-10"
                style={{
                  backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)",
                  backgroundSize: "100% 4px",
                }}
              />

              {/* Synthetic Grid Landscape */}
              <svg className="w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 400 200">
                <line x1="0" y1="130" x2="400" y2="130" stroke="#1E3842" strokeWidth="1" />
                <path d="M 0,130 L 70,110 L 150,125 L 240,105 L 320,120 L 400,115" fill="none" stroke="#25424D" strokeWidth="1.2" />
                <line x1="190" y1="0" x2="190" y2="200" stroke="#F4B65A" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
              </svg>

              {/* Center Target Lock Reticle */}
              <div className="relative z-20 flex flex-col items-center justify-center">
                <div className="w-24 h-24 border border-[#F07576]/60 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#F07576]" />
                  <div className="absolute top-0 w-[1px] h-3 bg-[#F07576]" />
                  <div className="absolute bottom-0 w-[1px] h-3 bg-[#F07576]" />
                  <div className="absolute left-0 w-3 h-[1px] bg-[#F07576]" />
                  <div className="absolute right-0 w-3 h-[1px] bg-[#F07576]" />
                </div>
                <div className="mt-2 text-[9px] font-bold text-[#F07576] bg-[#071014]/90 px-2 py-0.5 rounded border border-[#F07576]/40">
                  {alert.object_type.toUpperCase()} // TRACK {alert.object_id}
                </div>
              </div>

              {/* OSD Telemetry Stamps */}
              <div className="absolute inset-3 pointer-events-none z-20 flex flex-col justify-between text-[9px] text-[#758890]">
                <div className="flex items-center justify-between">
                  <span className="text-[#48D3D2] font-bold">EVIDENCE ID: EV-{alert.id.substring(0, 8).toUpperCase()}</span>
                  <span>BEARING: 274° // RANGE: 220M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SENSOR: EO/IR HYBRID + RADAR</span>
                  <span className="text-[#6ED694]">FRAME LOCK: VERIFIED</span>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Right Column: Operator Decision & Cryptographic Disposition Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <DashboardCard
            title="OPERATOR DISPOSITION & SIGN-OFF"
            subtitle="Append-only human judgment recorded to ledger"
            icon={<UserCheck className="w-4 h-4 text-[#F4B65A]" />}
            className="h-full flex flex-col"
          >
            <div className="flex flex-col gap-4 flex-1">
              {/* Reviewer Metadata */}
              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <div className="text-[9px] text-[#758890] uppercase font-bold">ADJUDICATOR ID</div>
                  <div className="text-xs font-bold text-[#E8F1F4] mt-0.5">OPERATOR_01 (STATION ALPHA)</div>
                </div>
                <Lock className="w-4 h-4 text-[#AD91FF]" />
              </div>

              {/* Review Notes Textarea */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">
                  OPERATIONAL NOTES & JUSTIFICATION
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter context, visual confirmation details, or notes before signing disposition..."
                  className="w-full min-h-[110px] flex-1 bg-[#071014] border border-[#192830] focus:border-[#48D3D2] rounded-xl p-3 text-xs text-[#E8F1F4] placeholder-[#52676F] focus:outline-none transition-colors font-mono-code resize-none custom-scrollbar"
                />
                <div className="text-[9px] text-[#52676F] text-right">
                  {notes.length} characters entered
                </div>
              </div>

              {/* 4 Disposition Actions */}
              <div className="space-y-2.5 pt-2">
                <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold mb-1">
                  SELECT ADJUDICATION OUTCOME:
                </div>

                {/* 1. Confirmed Simulation Class */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision("CONFIRMED SIMULATION CLASS")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#F07576]/40 bg-[#F07576]/10 hover:bg-[#F07576]/20 text-[#F07576] transition-all cursor-pointer group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">CONFIRMED SIMULATION CLASS</div>
                      <div className="text-[9px] text-[#F07576]/80">Create incident & escalate to command queue</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F07576]/20 border border-[#F07576]/40 shrink-0">
                    {activeDecision === "CONFIRMED SIMULATION CLASS" ? "SUBMITTING..." : "ESCALATE"}
                  </span>
                </button>

                {/* 2. Unresolved */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision("UNRESOLVED")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#F4B65A]/40 bg-[#F4B65A]/10 hover:bg-[#F4B65A]/20 text-[#F4B65A] transition-all cursor-pointer group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Clock className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">UNRESOLVED / MONITOR</div>
                      <div className="text-[9px] text-[#F4B65A]/80">Insufficient telemetry · Keep in active queue</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F4B65A]/20 border border-[#F4B65A]/40 shrink-0">
                    {activeDecision === "UNRESOLVED" ? "SUBMITTING..." : "FLAG"}
                  </span>
                </button>

                {/* 3. Benign / Ordinary Simulation */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision("BENIGN / ORDINARY SIMULATION")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#6ED694]/40 bg-[#6ED694]/10 hover:bg-[#6ED694]/20 text-[#6ED694] transition-all cursor-pointer group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">BENIGN / ORDINARY SIMULATION</div>
                      <div className="text-[9px] text-[#6ED694]/80">Authorized traffic or harmless synthetic object</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#6ED694]/20 border border-[#6ED694]/40 shrink-0">
                    {activeDecision === "BENIGN / ORDINARY SIMULATION" ? "SUBMITTING..." : "RESOLVE"}
                  </span>
                </button>

                {/* 4. False Alert */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision("FALSE ALERT")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#192830] bg-[#101E24] hover:bg-[#132128] text-[#758890] hover:text-[#E8F1F4] transition-all cursor-pointer group disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">FALSE ALERT / GHOST TRACK</div>
                      <div className="text-[9px] text-[#52676F]">Sensor calibration artifact or noise</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#071014] border border-[#192830] shrink-0">
                    {activeDecision === "FALSE ALERT" ? "SUBMITTING..." : "DISMISS"}
                  </span>
                </button>
              </div>

              {/* Safety Boundary Notice */}
              <div className="p-2.5 rounded-lg border border-[#192830] bg-[#071014] text-[9px] text-[#52676F] leading-relaxed mt-2">
                <span className="text-[#F4B65A] font-bold">MANDATORY PROTOCOL:</span> All operator decisions are immutably signed to the append-only SHA-256 ledger. Automated weapon engagement or operational firing is strictly prohibited.
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

