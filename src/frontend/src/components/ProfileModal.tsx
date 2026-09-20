import { useState } from "react";
import { 
  X, 
  User, 
  Edit3, 
  Check, 
  Radio, 
  BadgeCheck, 
  Clock, 
  MapPin, 
  Lock 
} from "lucide-react";
import { StatusPill } from "./primitives/StatusPill";
import type { OperatorProfile } from "../types/operator";

export type { OperatorProfile };

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: OperatorProfile;
  onSaveProfile: (updated: OperatorProfile) => void;
}

export function ProfileModal({ isOpen, onClose, profile, onSaveProfile }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<OperatorProfile>(profile);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OP";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071014]/80 backdrop-blur-sm overflow-y-auto font-mono-code"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[#192830] bg-[#0D171C] p-6 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#192830]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#101E24] border border-[#48D3D2]/50 flex items-center justify-center text-sm font-bold font-mono-code text-[#48D3D2] shadow-[0_0_10px_rgba(72,211,210,0.2)]">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="profile-modal-title" className="text-base font-bold text-[#E8F1F4]">
                  {profile.name}
                </h2>
                <StatusPill label="ACTIVE" variant="cyan" size="xs" />
              </div>
              <div className="text-xs text-[#758890] mt-0.5">
                {profile.role} · {profile.badgeId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close operator profile"
            className="p-1 rounded text-[#758890] hover:text-[#E8F1F4] hover:bg-[#101E24] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedFeedback && (
          <div className="my-3 p-2 rounded-lg bg-[#6ED694]/15 border border-[#6ED694]/40 text-[#6ED694] text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Operator profile updated successfully in local session.</span>
          </div>
        )}

        {/* Modal Content */}
        {!isEditing ? (
          /* View Mode */
          <div className="mt-4 space-y-4">
            {/* Telemetry Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#48D3D2]" /> OPERATOR NAME
                </div>
                <div className="text-xs font-bold text-[#E8F1F4] mt-1 truncate">{profile.name}</div>
              </div>

              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3 text-[#F4B65A]" /> BADGE / CALLSIGN
                </div>
                <div className="text-xs font-bold text-[#E8F1F4] mt-1">{profile.badgeId}</div>
              </div>

              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#6ED694]" /> ASSIGNED SECTOR
                </div>
                <div className="text-xs font-bold text-[#E8F1F4] mt-1 truncate">{profile.sector}</div>
              </div>

              <div className="bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#AD91FF]" /> ACTIVE SHIFT
                </div>
                <div className="text-xs font-bold text-[#E8F1F4] mt-1 truncate">{profile.shift}</div>
              </div>

              <div className="col-span-2 bg-[#101E24] border border-[#192830] p-3 rounded-lg">
                <div className="text-[10px] text-[#758890] uppercase font-bold flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#48D3D2]" /> ACCESS CLEARANCE
                </div>
                <div className="text-xs font-bold text-[#48D3D2] mt-1">{profile.clearance}</div>
              </div>
            </div>

            {/* Simulation Boundary Notice Box */}
            <div className="p-3 rounded-lg bg-[#071014] border border-[#192830] text-[10px] text-[#758890] leading-relaxed flex items-start gap-2">
              <Radio className="w-3.5 h-3.5 text-[#F4B65A] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#F4B65A]">SIMULATION BOUNDARY:</strong> Operator identity is synthetic and stored locally. No connection to government, military personnel records, or biometric identity databases.
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#192830]">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg border border-[#48D3D2]/40 bg-[#48D3D2]/10 hover:bg-[#48D3D2]/20 text-[#48D3D2] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDIT PROFILE</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#101E24] hover:bg-[#132128] border border-[#192830] text-[#E8F1F4] text-xs font-bold transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSave} className="mt-4 space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#758890] mb-1">
                Full Name / Callsign
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#101E24] border border-[#192830] focus:border-[#48D3D2] rounded-lg px-3 py-2 text-xs text-[#E8F1F4] outline-none transition-colors"
                placeholder="e.g. S. Rao"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#758890] mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#101E24] border border-[#192830] focus:border-[#48D3D2] rounded-lg px-3 py-2 text-xs text-[#E8F1F4] outline-none transition-colors"
                  placeholder="e.g. Site Operator"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#758890] mb-1">
                  Badge ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.badgeId}
                  onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
                  className="w-full bg-[#101E24] border border-[#192830] focus:border-[#48D3D2] rounded-lg px-3 py-2 text-xs text-[#E8F1F4] outline-none transition-colors"
                  placeholder="e.g. IBVAP-OP-01"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#758890] mb-1">
                Assigned Sector / Station
              </label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full bg-[#101E24] border border-[#192830] focus:border-[#48D3D2] rounded-lg px-3 py-2 text-xs text-[#E8F1F4] outline-none transition-colors"
                placeholder="e.g. Sector Alpha (Post 10-14)"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#758890] mb-1">
                Active Shift
              </label>
              <input
                type="text"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full bg-[#101E24] border border-[#192830] focus:border-[#48D3D2] rounded-lg px-3 py-2 text-xs text-[#E8F1F4] outline-none transition-colors"
                placeholder="e.g. Alpha Watch (0800 - 1600 IST)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#192830]">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg bg-[#101E24] hover:bg-[#132128] border border-[#192830] text-[#758890] hover:text-[#E8F1F4] text-xs font-bold transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg border border-[#6ED694]/50 bg-[#6ED694]/15 hover:bg-[#6ED694]/25 text-[#6ED694] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
