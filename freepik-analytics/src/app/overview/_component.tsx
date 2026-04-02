"use client";

import { useMemo } from "react";
import { DollarSign, Download, TrendingUp, Package } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { KPICard } from "@/components/ui/KPICard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartCard, SectionHeader } from "@/components/ui/SectionHeader";
import { EarningsLineChart, DownloadsLineChart } from "@/components/charts";
import { InsightCard } from "@/components/ui/InsightCard";
import { aggregateByMonth, generateInsights, formatCurrency, formatNumber } from "@/lib/parser";

export function OverviewPage() {
  const { assets, hydrated } = useStore();

  const monthly = useMemo(() => aggregateByMonth(assets), [assets]);
  const insights = useMemo(() => generateInsights(assets).slice(0, 3), [assets]);

  const totalEarnings = useMemo(() => assets.reduce((s, a) => s + a.earnings, 0), [assets]);
  const totalDownloads = useMemo(() => assets.reduce((s, a) => s + a.downloads, 0), [assets]);
  const revenuePerDownload = totalDownloads > 0 ? totalEarnings / totalDownloads : 0;

  // Contar assets unicos por nombre de archivo
  const uniqueAssets = useMemo(() => new Set(assets.map((a) => a.fileName)).size, [assets]);

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="p-8">
      <SectionHeader
        title="Resumen"
        subtitle={`Analizando ${formatNumber(uniqueAssets)} assets unicos en ${monthly.length} mes${monthly.length !== 1 ? "es" : ""}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Ganancias Totales"
          value={formatCurrency(totalEarnings)}
          icon={DollarSign}
          color="accent"
          delay={0}
        />
        <KPICard
          title="Descargas Totales"
          value={formatNumber(totalDownloads)}
          icon={Download}
          color="success"
          delay={50}
        />
        <KPICard
          title="Ingreso / Descarga"
          value={formatCurrency(revenuePerDownload)}
          icon={TrendingUp}
          color="warning"
          delay={100}
        />
        <KPICard
          title="Assets Unicos"
          value={formatNumber(uniqueAssets)}
          icon={Package}
          color="danger"
          delay={150}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <ChartCard title="Ganancias en el Tiempo">
          <EarningsLineChart data={monthly} />
        </ChartCard>
        <ChartCard title="Descargas en el Tiempo">
          <DownloadsLineChart data={monthly} />
        </ChartCard>
      </div>

      {/* Insights preview */}
      {insights.length > 0 && (
        <div>
          <p className="text-sm font-500 text-text-secondary mb-3">Estadisticas Clave</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} delay={i * 60} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
