import { AlertTriangle, ShieldAlert, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSimulationContext } from "../../contexts/SimulationContext";

interface ActiveAlertsPanelProps {
  alerts: string[];
}

export function ActiveAlertsPanel({ alerts }: ActiveAlertsPanelProps) {
  const navigate = useNavigate();
  const { 
    isAlarmPlaying, 
    isSoundEnabled, 
    toggleSound, 
    acknowledgeAllThreats, 
    acknowledgeThreat,
    acknowledgedThreatIds 
  } = useSimulationContext();

  if (alerts.length === 0) return null;

  // Filter out any already acknowledged alerts for the active card list, or show their status
  const unacknowledgedAlerts = alerts.filter(id => !acknowledgedThreatIds.includes(id));
  const displayAlerts = (unacknowledgedAlerts.length > 0 ? unacknowledgedAlerts : alerts).slice(-4).reverse();

  return (
    <div className="absolute bottom-10 right-4 w-80 flex flex-col gap-2 z-10 font-mono-code pointer-events-auto">
      <div className="bg-[#0D171C]/95 backdrop-blur-md border border-[#F07576]/40 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header with Silence/Ack button and Mute toggle */}
        <div className="px-3 py-2 border-b border-[#F07576]/20 bg-[#F07576]/10 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[#F07576]">
            <ShieldAlert className={`w-4 h-4 text-[#F07576] ${isAlarmPlaying ? 'animate-bounce' : 'animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isAlarmPlaying ? "ALARM ACTIVE" : "ACTIVE THREATS"}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Quick Silence / Ack All button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                acknowledgeAllThreats();
              }}
              className="px-2 py-0.5 rounded bg-[#6ED694]/20 border border-[#6ED694]/50 text-[#6ED694] hover:bg-[#6ED694]/30 text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              title="Acknowledge all threats and silence alarms"
            >
              <CheckCheck className="w-3 h-3" />
              <span>ACK ALL</span>
            </button>

            {/* Quick Mute Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
              className={`p-1 rounded border transition-colors cursor-pointer ${
                isSoundEnabled
                  ? "border-[#48D3D2]/40 text-[#48D3D2] hover:bg-[#48D3D2]/10"
                  : "border-[#F07576]/40 text-[#F07576] bg-[#F07576]/15 hover:bg-[#F07576]/25"
              }`}
              title={isSoundEnabled ? "Mute alarm audio" : "Unmute alarm audio"}
            >
              {isSoundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>

            <span className="bg-[#F07576]/20 text-[#F07576] border border-[#F07576]/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {alerts.length}
            </span>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex flex-col divide-y divide-[#192830]">
          {displayAlerts.map((alertId, idx) => {
            const isAcked = acknowledgedThreatIds.includes(alertId);
            return (
              <div 
                key={`${alertId}-${idx}`} 
                className="px-3 py-2 text-[10px] flex items-center justify-between hover:bg-[#101E24] transition-colors group"
              >
                <div 
                  onClick={() => navigate('/alerts')}
                  className="flex items-start gap-2.5 overflow-hidden cursor-pointer flex-1 mr-2"
                >
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform ${isAcked ? 'text-[#6ED694]' : 'text-[#F07576] group-hover:scale-110'}`} />
                  <div className="flex flex-col overflow-hidden">
                    <span className={`font-bold uppercase truncate leading-tight transition-colors ${isAcked ? 'text-[#6ED694]' : 'text-[#E8F1F4] group-hover:text-[#F07576]'}`}>
                      {isAcked ? "THREAT ACKNOWLEDGED" : "THREAT IN SECTOR"}
                    </span>
                    <span className="text-[#758890] text-[9px] truncate">
                      OBJ: {alertId.split('-')[0].toUpperCase()} · TAP FOR DETAILS
                    </span>
                  </div>
                </div>

                {!isAcked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledgeThreat(alertId);
                    }}
                    className="px-1.5 py-0.5 rounded bg-[#101E24] border border-[#192830] hover:border-[#6ED694]/60 text-[#758890] hover:text-[#6ED694] text-[9px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                  >
                    ACK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
