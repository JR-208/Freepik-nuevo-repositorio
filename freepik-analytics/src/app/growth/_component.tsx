"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartCard, SectionHeader } from "@/components/ui/SectionHeader";
import { KPICard } from "@/components/ui/KPICard";
import { GrowthChart, EarningsLineChart, DownloadsLineChart } from "@/components/charts";
import { aggregateByMonth, formatCurrency, formatNumber } from "@/lib/parser";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

export function GrowthPage() {
  const { assets, hydrated } = useStore();

  const monthly = useMemo(() => aggregateByMonth(assets), [assets]);

  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];

  const earningsGrowth = prevMonth && prevMonth.earnings > 0
    ? ((lastMonth.earnings - prevMonth.earnings) / prevMonth.earnings) * 100
    : null;

  const downloadsGrowth = prevMonth && prevMonth.downloads > 0
    ? ((lastMonth.downloads - prevMonth.downloads) / prevMonth.downloads) * 100
    : null;

  const GrowthIcon = (val: number | null) => {
    if (val === null) return Minus;
    return val >= 0 ? TrendingUp : TrendingDown;
  };

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="p-8">
      <SectionHeader
        title="Crecimiento"
        subtitle={`${monthly.length} meses de datos`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard
          title={`Ganancias Ultimo Mes (${lastMonth?.month || "—"})`}
          value={lastMonth ? formatCurrency(lastMonth.earnings) : "—"}
          change={earningsGrowth !== null ? `${earningsGrowth > 0 ? "+" : ""}${earningsGrowth.toFixed(1)}%` : undefined}
          changePositive={earningsGrowth !== null && earningsGrowth >= 0}
          icon={GrowthIcon(earningsGrowth)}
          color="accent"
          delay={0}
        />
        <KPICard
          title="Descargas Ultimo Mes"
          value={lastMonth ? formatNumber(lastMonth.downloads) : "—"}
          change={downloadsGrowth !== null ? `${downloadsGrowth > 0 ? "+" : ""}${downloadsGrowth.toFixed(1)}%` : undefined}
          changePositive={downloadsGrowth !== null && downloadsGrowth >= 0}
          icon={GrowthIcon(downloadsGrowth)}
          color="success"
          delay={50}
        />
        <KPICard
          title="Meses Registrados"
          value={String(monthly.length)}
          icon={Calendar}
          color="warning"
          delay={100}
        />
      </div>

      <ChartCard title="Crecimiento Combinado (Ganancias - Descargas - Nuevos Assets)" className="mb-4">
        <GrowthChart data={monthly} />
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Ganancias Mensuales">
          <EarningsLineChart data={monthly} />
        </ChartCard>
        <ChartCard title="Descargas Mensuales">
          <DownloadsLineChart data={monthly} />
        </ChartCard>
      </div>

      {/* Monthly table */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-500 text-text-secondary">Desglose Mensual</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Mes", "Nuevos Assets", "Descargas", "Ganancias", "Ganancia Prom/Asset"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-500 text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...monthly].reverse().map((m) => (
              <tr key={m.month} className="border-b border-border/50 table-row-hover">
                <td className="px-4 py-3 font-500 text-text-primary">{m.month}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(m.newAssets)}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(m.downloads)}</td>
                <td className="px-4 py-3 text-text-primary font-500 tabular-nums">{formatCurrency(m.earnings)}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">
                  {m.assetCount > 0 ? formatCurrency(m.earnings / m.assetCount) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
