"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  color?: "accent" | "success" | "warning" | "danger";
  className?: string;
  delay?: number;
}

const colorMap = {
  accent: { bg: "bg-accent/10", icon: "text-accent", border: "border-accent/20" },
  success: { bg: "bg-success/10", icon: "text-success", border: "border-success/20" },
  warning: { bg: "bg-warning/10", icon: "text-warning", border: "border-warning/20" },
  danger: { bg: "bg-danger/10", icon: "text-danger", border: "border-danger/20" },
};

export function KPICard({ title, value, change, changePositive, icon: Icon, color = "accent", className, delay = 0 }: KPICardProps) {
  const colors = colorMap[color];
  return (
    <div
      className={cn(
        "card-base p-5 animate-slide-up opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.bg)}>
          <Icon size={17} className={colors.icon} />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-500 px-2 py-0.5 rounded-full",
              changePositive
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-600 text-text-primary tracking-tight">{value}</p>
      <p className="text-xs text-text-muted mt-1">{title}</p>
    </div>
  );
}
