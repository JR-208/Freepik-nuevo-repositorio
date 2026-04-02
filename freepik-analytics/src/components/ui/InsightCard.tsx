"use client";

import { TrendingUp, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Insight } from "@/types";

const config = {
  positive: {
    icon: TrendingUp,
    bg: "bg-success/10",
    border: "border-success/20",
    iconColor: "text-success",
    badge: "bg-success/10 text-success",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/20",
    iconColor: "text-warning",
    badge: "bg-warning/10 text-warning",
  },
  neutral: {
    icon: Info,
    bg: "bg-accent/10",
    border: "border-accent/20",
    iconColor: "text-accent",
    badge: "bg-accent/10 text-accent",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400",
  },
};

export function InsightCard({ insight, delay = 0 }: { insight: Insight; delay?: number }) {
  const c = config[insight.type];
  const Icon = c.icon;

  return (
    <div
      className={cn("card-base p-4 border animate-slide-up opacity-0", c.border)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", c.bg)}>
          <Icon size={15} className={c.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-500 text-text-primary">{insight.title}</p>
            {insight.value && (
              <span className={cn("text-xs font-600 px-2 py-0.5 rounded-full shrink-0", c.badge)}>
                {insight.value}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}
