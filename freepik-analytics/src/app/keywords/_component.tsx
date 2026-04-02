"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { extractKeywords, formatCurrency } from "@/lib/parser";
import { cn } from "@/lib/cn";

type Tab = "frequency" | "earnings" | "downloads";

export function KeywordsPage() {
  const { assets, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("frequency");

  const keywords = useMemo(() => extractKeywords(assets), [assets]);

  const sorted = useMemo(() => {
    if (tab === "frequency") return [...keywords].sort((a, b) => b.count - a.count);
    if (tab === "earnings") return [...keywords].sort((a, b) => b.earnings - a.earnings);
    return [...keywords].sort((a, b) => b.downloads - a.downloads);
  }, [keywords, tab]);

  const maxVal = useMemo(() => {
    if (tab === "frequency") return Math.max(...sorted.map((k) => k.count), 1);
    if (tab === "earnings") return Math.max(...sorted.map((k) => k.earnings), 1);
    return Math.max(...sorted.map((k) => k.downloads), 1);
  }, [sorted, tab]);

  const getValue = (k: typeof sorted[0]) => {
    if (tab === "frequency") return k.count;
    if (tab === "earnings") return k.earnings;
    return k.downloads;
  };

  const formatVal = (v: number) => {
    if (tab === "earnings") return formatCurrency(v);
    return v.toLocaleString("es-ES");
  };

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  const TABS: { key: Tab; label: string }[] = [
    { key: "frequency", label: "Mas Frecuentes" },
    { key: "earnings", label: "Mayores Ganancias" },
    { key: "downloads", label: "Mas Descargas" },
  ];

  const tabLabels: Record<Tab, string> = {
    frequency: "frecuencia",
    earnings: "ganancias",
    downloads: "descargas",
  };

  return (
    <div className="p-8">
      <SectionHeader
        title="Analisis de Palabras Clave"
        subtitle={`${keywords.length} palabras clave extraidas de titulos y descripciones`}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-500 transition-all",
              tab === key
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-surface-1 text-text-secondary border border-border hover:border-accent/20"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tag cloud */}
      <div className="card-base p-6 mb-6">
        <p className="text-xs text-text-muted mb-4">Nube de etiquetas — el tamano representa {tabLabels[tab]}</p>
        <div className="flex flex-wrap gap-2">
          {[...keywords].sort((a, b) => b.count - a.count).slice(0, 40).map((k) => {
            const size = 10 + (k.count / Math.max(...keywords.map((x) => x.count), 1)) * 16;
            return (
              <span
                key={k.keyword}
                className="px-2.5 py-1 rounded-lg bg-surface-2 text-text-secondary hover:bg-accent/10 hover:text-accent transition-all cursor-default"
                style={{ fontSize: `${size}px` }}
              >
                {k.keyword}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bar list */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-500 text-text-secondary">
            Top 30 palabras clave por {tabLabels[tab]}
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {sorted.slice(0, 30).map((k, i) => {
            const val = getValue(k);
            const pct = (val / maxVal) * 100;
            return (
              <div key={k.keyword} className="px-5 py-3 flex items-center gap-4 table-row-hover">
                <span className="text-xs text-text-muted w-5 tabular-nums">{i + 1}</span>
                <span className="text-sm font-500 text-text-primary w-32 shrink-0">{k.keyword}</span>
                <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-text-secondary tabular-nums w-24 text-right shrink-0">
                  {formatVal(val)}
                </span>
                <span className="text-xs text-text-muted w-16 text-right shrink-0">
                  {k.count} assets
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
