import { useState, useEffect, useCallback } from "react";
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
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Link2, 
  RotateCw, 
  FileText, 
  Lock, 
  Database,
  Hash
} from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { StatusPill } from "../components/primitives/StatusPill";

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  outcome: string;
  reason: string | null;
  previous_hash: string | null;
  current_hash: string;
  timestamp: string;
  is_synthetic: boolean;
};

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<"IDLE" | "VERIFIED" | "INVALID">("IDLE");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/audit");
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/audit");
        if (isMounted && Array.isArray(res.data)) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/audit/verify");
      setVerifyStatus(res.data.status === "VERIFIED" || res.data.verified ? "VERIFIED" : "INVALID");
    } catch (err) {
      console.error("Verification failed", err);
      setVerifyStatus("INVALID");
    } finally {
      setIsVerifying(false);
    }
  };

  const getActionVariant = (action: string): "cyan" | "amber" | "violet" | "green" | "red" => {
    const a = action.toLowerCase();
    if (a.includes("breach") || a.includes("threat") || a.includes("critical")) return "red";
    if (a.includes("acknowledge") || a.includes("ack")) return "green";
    if (a.includes("escalat") || a.includes("review") || a.includes("override")) return "violet";
    if (a.includes("simulation") || a.includes("start") || a.includes("reset")) return "amber";
    return "cyan";
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#071014] text-[#E8F1F4] gap-5 overflow-hidden font-mono-code">
      {/* Top Hash Chain Integrity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">CHAIN LENGTH</div>
            <div className="text-xl font-bold text-[#E8F1F4] leading-tight">{logs.length} BLOCKS</div>
          </div>
          <FileText className="w-4 h-4 text-[#48D3D2]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">INTEGRITY STATUS</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${verifyStatus === "VERIFIED" ? "bg-[#6ED694] shadow-[0_0_6px_#6ED694]" : verifyStatus === "INVALID" ? "bg-[#F07576]" : "bg-[#F4B65A]"}`} />
              <span className={`text-sm font-bold ${verifyStatus === "VERIFIED" ? "text-[#6ED694]" : verifyStatus === "INVALID" ? "text-[#F07576]" : "text-[#F4B65A]"}`}>
                {verifyStatus === "VERIFIED" ? "CHAIN VALID" : verifyStatus === "INVALID" ? "CORRUPTED" : "UNVERIFIED"}
              </span>
            </div>
          </div>
          <Lock className="w-4 h-4 text-[#AD91FF]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">HASH ALGORITHM</div>
            <div className="text-xl font-bold text-[#AD91FF] leading-tight">SHA-256</div>
          </div>
          <Hash className="w-4 h-4 text-[#AD91FF]" />
        </div>

        <div className="bg-[#0D171C] border border-[#192830] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#758890] uppercase tracking-wider font-bold">LEDGER TYPE</div>
            <div className="text-xl font-bold text-[#6ED694] leading-tight">APPEND-ONLY</div>
          </div>
          <Database className="w-4 h-4 text-[#6ED694]" />
        </div>
      </div>

      {/* Main Cryptographic Audit Trail Panel */}
      <DashboardCard
        title="IMMUTABLE CHAIN-OF-CUSTODY AUDIT TRAIL"
        subtitle="Cryptographically chained SHA-256 audit ledger · Evidence provenance"
        icon={<ShieldCheck className="w-4 h-4 text-[#AD91FF]" />}
        className="flex-1 h-full min-h-[400px]"
        contentClassName="p-0 overflow-hidden flex flex-col h-full"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Chain Integrity Badge */}
            {verifyStatus === "VERIFIED" && (
              <span className="flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-[#6ED694] border border-[#6ED694]/40 bg-[#6ED694]/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                CHAIN VERIFIED
              </span>
            )}
            {verifyStatus === "INVALID" && (
              <span className="flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-[#F07576] border border-[#F07576]/50 bg-[#F07576]/15 px-2.5 py-1 rounded-lg animate-pulse">
                <XCircle className="w-3.5 h-3.5" />
                INTEGRITY INVALID
              </span>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-1.5 bg-[#AD91FF]/15 hover:bg-[#AD91FF]/25 text-[#AD91FF] border border-[#AD91FF]/40 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerifying ? "COMPUTING HASHES..." : "VERIFY HASH CHAIN"}</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={fetchLogs}
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
                  TIMESTAMP (UTC)
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  ACTOR
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  ACTION
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  RESOURCE
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10">
                  OUTCOME
                </TableHead>
                <TableHead className="font-mono-code text-[10px] text-[#758890] tracking-wider uppercase h-10 text-right px-4">
                  SHA-256 BLOCK CHAIN
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow className="hover:bg-transparent border-[#192830]">
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-[#758890] font-mono-code text-xs uppercase tracking-wider"
                  >
                    No audit records registered in current chain
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-[#192830] hover:bg-[#101E24] transition-colors group"
                  >
                    {/* Timestamp */}
                    <TableCell className="font-mono-code text-xs text-[#758890] whitespace-nowrap px-4">
                      {new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19)}
                    </TableCell>

                    {/* Actor */}
                    <TableCell className="font-mono-code text-xs font-bold text-[#E8F1F4]">
                      {log.actor}
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <StatusPill
                        label={log.action.replace(/_/g, " ").toUpperCase()}
                        variant={getActionVariant(log.action)}
                        size="xs"
                      />
                    </TableCell>

                    {/* Resource */}
                    <TableCell className="font-mono-code text-xs text-[#48D3D2]">
                      {log.resource}
                    </TableCell>

                    {/* Outcome */}
                    <TableCell>
                      <span className="text-[10px] font-mono-code tracking-wider px-2 py-0.5 rounded bg-[#101E24] border border-[#192830] text-[#E8F1F4]">
                        {log.outcome.toUpperCase()}
                      </span>
                    </TableCell>

                    {/* Hash Chain Hashes */}
                    <TableCell className="text-right px-4">
                      <div className="flex flex-col items-end gap-1 font-mono-code text-[9px]">
                        <span
                          className="truncate max-w-[200px] flex items-center justify-end gap-1 text-[#758890]"
                          title={log.previous_hash || "GENESIS_ROOT"}
                        >
                          <Link2 className="w-3 h-3 text-[#52676F]" />
                          PREV: {log.previous_hash ? `${log.previous_hash.substring(0, 12)}...` : "GENESIS_ROOT"}
                        </span>
                        <span
                          className="truncate max-w-[200px] text-[#AD91FF] font-bold"
                          title={log.current_hash}
                        >
                          CURR: {log.current_hash ? `${log.current_hash.substring(0, 12)}...` : "UNHASHED"}
                        </span>
                      </div>
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

