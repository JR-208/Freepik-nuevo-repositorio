"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartCard, SectionHeader } from "@/components/ui/SectionHeader";
import { TypeBarChart } from "@/components/charts";
import { KPICard } from "@/components/ui/KPICard";
import { aggregateByType, formatCurrency, formatNumber } from "@/lib/parser";
import { BarChart3, Star, TrendingUp } from "lucide-react";

export function TypesPage() {
  const { assets, hydrated } = useStore();

  const byType = useMemo(() => aggregateByType(assets), [assets]);

  const earningsData = useMemo(
    () => byType.map((t) => ({ type: t.type, value: t.earnings })),
    [byType]
  );
  const downloadsData = useMemo(
    () => byType.map((t) => ({ type: t.type, value: t.downloads })),
    [byType]
  );
  const epdData = useMemo(
    () => [...byType].sort((a, b) => b.earningsPerDownload - a.earningsPerDownload)
      .map((t) => ({ type: t.type, value: t.earningsPerDownload })),
    [byType]
  );

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  const best = byType[0];
  const mostDownloaded = [...byType].sort((a, b) => b.downloads - a.downloads)[0];
  const bestEPD = [...byType].filter((t) => t.downloads > 0).sort((a, b) => b.earningsPerDownload - a.earningsPerDownload)[0];

  return (
    <div className="p-8">
      <SectionHeader title="Analisis por Tipo de Asset" subtitle={`${byType.length} tipos de asset`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {best && (
          <KPICard title="Tipo con Mas Ganancias" value={best.type} icon={Star} color="warning" delay={0} />
        )}
        {mostDownloaded && (
          <KPICard title="Tipo Mas Descargado" value={mostDownloaded.type} icon={BarChart3} color="accent" delay={50} />
        )}
        {bestEPD && (
          <KPICard
            title="Mejor Ingreso/Descarga"
            value={formatCurrency(bestEPD.earningsPerDownload)}
            icon={TrendingUp}
            color="success"
            delay={100}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Ganancias por Tipo de Asset">
          <TypeBarChart
            data={earningsData}
            color="accent"
            formatValue={(v) => formatCurrency(v)}
          />
        </ChartCard>
        <ChartCard title="Descargas por Tipo de Asset">
          <TypeBarChart
            data={downloadsData}
            color="success"
            formatValue={(v) => formatNumber(v)}
          />
        </ChartCard>
      </div>

      <ChartCard title="Ganancias por Descarga segun Tipo (eficiencia)">
        <TypeBarChart
          data={epdData}
          color="accent"
          formatValue={(v) => formatCurrency(v)}
        />
      </ChartCard>

      {/* Detail table */}
      <div className="card-base mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-500 text-text-secondary">Desglose por Tipo</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Tipo", "Assets", "Descargas", "Ganancias", "Ganancia Prom", "Ingreso/DL"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-500 text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byType.map((t, i) => (
              <tr key={t.type} className="border-b border-border/50 table-row-hover">
                <td className="px-4 py-3 font-500 text-text-primary">
                  <span className="flex items-center gap-2">
                    {i === 0 && <span className="text-warning text-xs">★</span>}
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(t.count)}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(t.downloads)}</td>
                <td className="px-4 py-3 text-text-primary font-500 tabular-nums">{formatCurrency(t.earnings)}</td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">
                  {t.count > 0 ? formatCurrency(t.earnings / t.count) : "—"}
                </td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">
                  {t.downloads > 0 ? formatCurrency(t.earningsPerDownload) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
