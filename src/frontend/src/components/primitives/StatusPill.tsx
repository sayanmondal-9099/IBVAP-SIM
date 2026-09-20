import React from 'react';
import type { LucideIcon } from 'lucide-react';


export type StatusPillVariant =
  | 'cyan'
  | 'amber'
  | 'violet'
  | 'green'
  | 'red'
  | 'muted';

export interface StatusPillProps {
  label: string;
  variant?: StatusPillVariant;
  dot?: boolean;
  pulse?: boolean;
  icon?: LucideIcon;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'cyan',
  dot = false,
  pulse = false,
  icon: Icon,
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    cyan: {
      pill: 'bg-[#48D3D2]/10 text-[#48D3D2] border-[#48D3D2]/30',
      dot: 'bg-[#48D3D2] shadow-[0_0_6px_#48D3D2]',
    },
    amber: {
      pill: 'bg-[#F4B65A]/15 text-[#F4B65A] border-[#F4B65A]/30',
      dot: 'bg-[#F4B65A] shadow-[0_0_6px_#F4B65A]',
    },
    violet: {
      pill: 'bg-[#AD91FF]/15 text-[#AD91FF] border-[#AD91FF]/30',
      dot: 'bg-[#AD91FF] shadow-[0_0_6px_#AD91FF]',
    },
    green: {
      pill: 'bg-[#6ED694]/15 text-[#6ED694] border-[#6ED694]/30',
      dot: 'bg-[#6ED694] shadow-[0_0_6px_#6ED694]',
    },
    red: {
      pill: 'bg-[#F07576]/15 text-[#F07576] border-[#F07576]/30',
      dot: 'bg-[#F07576] shadow-[0_0_6px_#F07576]',
    },
    muted: {
      pill: 'bg-[#758890]/15 text-[#758890] border-[#758890]/30',
      dot: 'bg-[#52676F]',
    },
  }[variant];

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.2',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono-code font-bold uppercase tracking-wider border ${variantStyles.pill} ${sizeStyles} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      {dot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes} ${variantStyles.dot} ${
            pulse ? 'animate-ping' : ''
          }`}
        />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
