import React from 'react';
import type { LucideIcon } from 'lucide-react';


export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  accentColor?: 'cyan' | 'amber' | 'violet' | 'green' | 'red';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  accentColor = 'cyan',
  onClick,
  className = '',
}) => {
  let colorClasses = {
    iconBg: 'bg-[#48D3D2]/10',
    iconText: 'text-[#48D3D2]',
    borderColor: 'border-[#192830] hover:border-[#48D3D2]/40',
    glow: 'group-hover:text-[#48D3D2]',
  };

  if (accentColor === 'amber') {
    colorClasses = {
      iconBg: 'bg-[#F4B65A]/10',
      iconText: 'text-[#F4B65A]',
      borderColor: 'border-[#192830] hover:border-[#F4B65A]/40',
      glow: 'group-hover:text-[#F4B65A]',
    };
  } else if (accentColor === 'violet') {
    colorClasses = {
      iconBg: 'bg-[#AD91FF]/10',
      iconText: 'text-[#AD91FF]',
      borderColor: 'border-[#192830] hover:border-[#AD91FF]/40',
      glow: 'group-hover:text-[#AD91FF]',
    };
  } else if (accentColor === 'green') {
    colorClasses = {
      iconBg: 'bg-[#6ED694]/10',
      iconText: 'text-[#6ED694]',
      borderColor: 'border-[#192830] hover:border-[#6ED694]/40',
      glow: 'group-hover:text-[#6ED694]',
    };
  } else if (accentColor === 'red') {
    colorClasses = {
      iconBg: 'bg-[#F07576]/10',
      iconText: 'text-[#F07576]',
      borderColor: 'border-[#192830] hover:border-[#F07576]/40',
      glow: 'group-hover:text-[#F07576]',
    };
  }

  const formattedValue = typeof value === 'number' ? value.toString().padStart(2, '0') : value;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group relative rounded-xl border bg-[#0D171C] p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-[#101E24] focus:outline-none focus:ring-1 focus:ring-[#48D3D2]/50' : ''
      } ${colorClasses.borderColor} shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider font-mono-code text-[#758890] truncate">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${colorClasses.iconBg} ${colorClasses.iconText} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl sm:text-3xl font-bold font-mono-code text-[#E8F1F4] transition-colors ${colorClasses.glow}`}
        >
          {formattedValue}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-[#758890] truncate flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#52676F] inline-block shrink-0" />
        <span className="truncate">{subtext}</span>
      </p>
    </div>
  );
};
