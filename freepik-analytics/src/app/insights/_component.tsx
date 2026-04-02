"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InsightCard } from "@/components/ui/InsightCard";
import { generateInsights, aggregateByType, formatCurrency } from "@/lib/parser";
import { Lightbulb, Rocket } from "lucide-react";

export function InsightsPage() {
  const { assets, hydrated } = useStore();

  const insights = useMemo(() => generateInsights(assets), [assets]);
  const byType = useMemo(() => aggregateByType(assets), [assets]);

  // Recommendation engine
  const recommendations = useMemo(() => {
    if (byType.length < 2) return [];
    const top = byType[0];
    const sorted = [...byType].sort((a, b) => b.earningsPerDownload - a.earningsPerDownload);
    const recs = [];

    recs.push({
      title: `Crea mas assets "${top.type}"`,
      desc: `Esta es tu categoria con mas ganancias con ${formatCurrency(top.earnings)} en total. Duplicar esfuerzos aqui tiene el mejor ROI comprobado.`,
      priority: "high",
    });

    if (sorted[0].type !== top.type) {
      recs.push({
        title: `Experimenta con la eficiencia de "${sorted[0].type}"`,
        desc: `Tiene tu mayor ingreso por descarga con ${formatCurrency(sorted[0].earningsPerDownload)}/DL. Incluso unos pocos assets bien enfocados podrian rendir por encima de su peso.`,
        priority: "medium",
      });
    }

    const lowestEPD = [...byType].filter((t) => t.downloads > 5).sort((a, b) => a.earningsPerDownload - b.earningsPerDownload)[0];
    if (lowestEPD && lowestEPD.type !== top.type) {
      recs.push({
        title: `Reduce el esfuerzo en "${lowestEPD.type}"`,
        desc: `Con ${formatCurrency(lowestEPD.earningsPerDownload)}/DL tiene tu menor eficiencia. Reasignar este esfuerzo a tipos de mejor rendimiento podria aumentar significativamente las ganancias.`,
        priority: "low",
      });
    }

    const zeroByType = byType.map((t) => ({
      ...t,
      zeroCount: assets.filter((a) => a.assetType === t.type && a.downloads === 0).length,
    })).filter((t) => t.zeroCount > 0).sort((a, b) => b.zeroCount - a.zeroCount);

    if (zeroByType.length > 0) {
      recs.push({
        title: `Actualiza titulos en "${zeroByType[0].type}"`,
        desc: `${zeroByType[0].zeroCount} assets en esta categoria tienen cero descargas. Mejores titulos, etiquetas y descripciones podrian desbloquear trafico latente.`,
        priority: "medium",
      });
    }

    return recs;
  }, [byType, assets]);

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  const priorityColor: Record<string, string> = {
    high: "text-success bg-success/10 border-success/20",
    medium: "text-warning bg-warning/10 border-warning/20",
    low: "text-text-muted bg-surface-2 border-border",
  };

  const priorityLabels: Record<string, string> = {
    high: "alta",
    medium: "media",
    low: "baja",
  };

  return (
    <div className="p-8">
      <SectionHeader
        title="Estadisticas"
        subtitle="Analisis auto-generado de tus datos de rendimiento"
      />

      {/* Insights */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={15} className="text-accent" />
          <p className="text-sm font-500 text-text-secondary">Estadisticas de Rendimiento</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <InsightCard key={ins.id} insight={ins} delay={i * 50} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket size={15} className="text-accent" />
            <p className="text-sm font-500 text-text-secondary">Recomendaciones</p>
          </div>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div
                key={i}
                className="card-base p-4 flex items-start gap-4 animate-slide-up opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
              >
                <span className={`text-xs font-600 px-2 py-1 rounded-full border shrink-0 mt-0.5 ${priorityColor[r.priority]}`}>
                  {priorityLabels[r.priority]}
                </span>
                <div>
                  <p className="text-sm font-500 text-text-primary mb-1">{r.title}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
