import React from 'react';

export interface SensorRingProps {
  size?: 'sm' | 'md' | 'lg';
  accentColor?: 'cyan' | 'amber' | 'violet' | 'green' | 'red';
  pulse?: boolean;
  className?: string;
}

export const SensorRing: React.FC<SensorRingProps> = ({
  size = 'md',
  accentColor = 'cyan',
  pulse = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }[size];

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  }[size];

  const colorClasses = {
    cyan: {
      outer: 'border-[#48D3D2]/40',
      inner: 'border-[#48D3D2]/60',
      dot: 'bg-[#48D3D2]',
      cross: 'bg-[#48D3D2]/20',
      glow: 'shadow-[0_0_8px_rgba(72,211,210,0.5)]',
    },
    amber: {
      outer: 'border-[#F4B65A]/40',
      inner: 'border-[#F4B65A]/60',
      dot: 'bg-[#F4B65A]',
      cross: 'bg-[#F4B65A]/20',
      glow: 'shadow-[0_0_8px_rgba(244,182,90,0.5)]',
    },
    violet: {
      outer: 'border-[#AD91FF]/40',
      inner: 'border-[#AD91FF]/60',
      dot: 'bg-[#AD91FF]',
      cross: 'bg-[#AD91FF]/20',
      glow: 'shadow-[0_0_8px_rgba(173,145,255,0.5)]',
    },
    green: {
      outer: 'border-[#6ED694]/40',
      inner: 'border-[#6ED694]/60',
      dot: 'bg-[#6ED694]',
      cross: 'bg-[#6ED694]/20',
      glow: 'shadow-[0_0_8px_rgba(110,214,148,0.5)]',
    },
    red: {
      outer: 'border-[#F07576]/40',
      inner: 'border-[#F07576]/60',
      dot: 'bg-[#F07576]',
      cross: 'bg-[#F07576]/20',
      glow: 'shadow-[0_0_8px_rgba(240,117,118,0.5)]',
    },
  }[accentColor];

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
    >
      {/* Outer Continuous Ring */}
      <div
        className={`absolute inset-0 rounded-full border ${colorClasses.outer} ${
          pulse ? 'animate-halo-pulse' : ''
        }`}
      />

      {/* Inner Dashed Ring */}
      <div
        className={`absolute inset-1 rounded-full border border-dashed ${colorClasses.inner}`}
      />

      {/* Center Target Point */}
      <div className={`rounded-full ${dotSizes} ${colorClasses.dot} ${colorClasses.glow}`} />

      {/* Crosshair Horizontal Axis */}
      <div className={`absolute w-full h-[1px] ${colorClasses.cross}`} />

      {/* Crosshair Vertical Axis */}
      <div className={`absolute h-full w-[1px] ${colorClasses.cross}`} />
    </div>
  );
};
