import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';


export interface HudPanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon | ReactNode;
  iconAccent?: 'cyan' | 'amber' | 'violet' | 'green' | 'red';
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export const HudPanel: React.FC<HudPanelProps> = ({
  title,
  subtitle,
  icon,
  iconAccent = 'cyan',
  action,
  footer,
  children,
  className = '',
  contentClassName = '',
  noPadding = false,
}) => {
  const iconAccentClasses = {
    cyan: 'bg-[#48D3D2]/10 text-[#48D3D2]',
    amber: 'bg-[#F4B65A]/10 text-[#F4B65A]',
    violet: 'bg-[#AD91FF]/10 text-[#AD91FF]',
    green: 'bg-[#6ED694]/10 text-[#6ED694]',
    red: 'bg-[#F07576]/10 text-[#F07576]',
  }[iconAccent];

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-4 h-4" />;
    }
    return icon;
  };

  return (
    <section
      className={`rounded-xl border border-[#192830] bg-[#0D171C] shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-200 hover:border-[#192830]/90 ${className}`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        {(title || action) && (
          <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 border-b border-[#192830] bg-[#0D171C]/90 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className={`p-1.5 rounded-lg ${iconAccentClasses} shrink-0`}>
                  {renderIcon()}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-xs font-bold uppercase font-mono-code tracking-wider text-[#E8F1F4] truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <div className="text-[11px] text-[#758890] font-mono-code truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}

        {/* Content */}
        <div className={`flex-1 min-h-0 ${noPadding ? '' : 'p-4 sm:p-5'} ${contentClassName}`}>
          {children}
        </div>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="px-4 py-3 sm:px-5 border-t border-[#192830] bg-[#091317] flex items-center justify-between text-xs font-mono-code">
          {footer}
        </footer>
      )}
    </section>
  );
};
