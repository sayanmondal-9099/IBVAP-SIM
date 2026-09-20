import type { ReactNode } from "react";
import { HudPanel } from "./primitives/HudPanel";

export interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  action,
  className = "",
  contentClassName = "",
  noPadding = false,
}: DashboardCardProps) {
  return (
    <HudPanel
      title={title}
      subtitle={subtitle}
      icon={icon}
      action={action}
      className={className}
      contentClassName={contentClassName}
      noPadding={noPadding}
    >
      {children}
    </HudPanel>
  );
}

