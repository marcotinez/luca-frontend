'use client';

import { ReactNode } from "react";

interface UserInfoItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function UserInfoItem({
  icon,
  label,
  value,
  className = "",
  orientation = 'vertical'
}: UserInfoItemProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="text-emerald-500 shrink-0">{icon}</div>
          <span className="font-medium whitespace-nowrap">{label}</span>
        </div>
        <span className="font-semibold text-foreground text-right break-words">{value}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="text-emerald-500 shrink-0">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="pl-6">
        <span className="font-semibold text-foreground break-words leading-tight">{value}</span>
      </div>
    </div>
  );
}
