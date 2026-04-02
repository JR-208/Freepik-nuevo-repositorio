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

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="p-8">
      <SectionHeader
        title="Overview"
        subtitle={`Analyzing ${formatNumber(assets.length)} assets across ${monthly.length} month${monthly.length !== 1 ? "s" : ""}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Earnings"
          value={formatCurrency(totalEarnings)}
          icon={DollarSign}
          color="accent"
          delay={0}
        />
        <KPICard
          title="Total Downloads"
          value={formatNumber(totalDownloads)}
          icon={Download}
          color="success"
          delay={50}
        />
        <KPICard
          title="Revenue / Download"
          value={`$${revenuePerDownload.toFixed(4)}`}
          icon={TrendingUp}
          color="warning"
          delay={100}
        />
        <KPICard
          title="Total Assets"
          value={formatNumber(assets.length)}
          icon={Package}
          color="danger"
          delay={150}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <ChartCard title="Earnings Over Time">
          <EarningsLineChart data={monthly} />
        </ChartCard>
        <ChartCard title="Downloads Over Time">
          <DownloadsLineChart data={monthly} />
        </ChartCard>
      </div>

      {/* Insights preview */}
      {insights.length > 0 && (
        <div>
          <p className="text-sm font-500 text-text-secondary mb-3">Key Insights</p>
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
