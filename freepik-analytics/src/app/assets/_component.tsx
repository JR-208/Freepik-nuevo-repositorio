"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink,
  Search, Trophy, AlertCircle, TrendingUp,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ExportAIButton } from "@/components/ui/ExportAIButton";
import { formatCurrency, formatNumber } from "@/lib/parser";
import { cn } from "@/lib/cn";
import type { Asset } from "@/types";

// Ordenacion por columnas de la tabla (vista por registro)
type SortKey = "fileName" | "assetType" | "downloads" | "earnings" | "month";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "top_earnings" | "top_downloads" | "zero";

// Agrega los registros del mismo asset (mismo fileName) en todos los meses
function aggregateByFileName(assets: Asset[]) {
  const map = new Map<string, {
    fileName: string;
    assetType: string;
    url: string;
    totalEarnings: number;
    totalDownloads: number;
    months: string[];
    latestMonth: string;
  }>();

  for (const a of assets) {
    const prev = map.get(a.fileName);
    if (prev) {
      map.set(a.fileName, {
        ...prev,
        totalEarnings: prev.totalEarnings + a.earnings,
        totalDownloads: prev.totalDownloads + a.downloads,
        months: prev.months.includes(a.month) ? prev.months : [...prev.months, a.month].sort(),
        latestMonth: a.month > prev.latestMonth ? a.month : prev.latestMonth,
      });
    } else {
      map.set(a.fileName, {
        fileName: a.fileName,
        assetType: a.assetType,
        url: a.url,
        totalEarnings: a.earnings,
        totalDownloads: a.downloads,
        months: [a.month],
        latestMonth: a.month,
      });
    }
  }
  return [...map.values()];
}

const HIGHLIGHT = {
  topEarnings: "border-l-2 border-l-warning",
  topDownloads: "border-l-2 border-l-accent",
  zero: "border-l-2 border-l-danger opacity-60",
};

export function AssetsPage() {
  const { assets, hydrated } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("earnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  // Opciones de tipo
  const assetTypes = useMemo(() => {
    const types = [...new Set(assets.map((a) => a.assetType))].sort();
    return ["all", ...types];
  }, [assets]);

  // Opciones de mes
  const months = useMemo(() => {
    const ms = [...new Set(assets.map((a) => a.month))].sort();
    return ["all", ...ms];
  }, [assets]);

  // Vista agregada: un registro por asset (suma de todos los meses)
  const aggregated = useMemo(() => aggregateByFileName(assets), [assets]);

  // Top sets basados en el total por asset (no por registro individual)
  const top10EarningsNames = useMemo(() => {
    const names = new Set(
      [...aggregated].sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 10).map((a) => a.fileName)
    );
    return names;
  }, [aggregated]);

  const top10DownloadsNames = useMemo(() => {
    const names = new Set(
      [...aggregated].sort((a, b) => b.totalDownloads - a.totalDownloads).slice(0, 10).map((a) => a.fileName)
    );
    return names;
  }, [aggregated]);

  const zeroDownloadsNames = useMemo(() => {
    const names = new Set(
      aggregated.filter((a) => a.totalDownloads === 0).map((a) => a.fileName)
    );
    return names;
  }, [aggregated]);

  // Filtrado: sobre registros individuales (para respetar el filtro de mes)
  const filtered = useMemo(() => {
    let result = assets;

    if (typeFilter !== "all") result = result.filter((a) => a.assetType === typeFilter);
    if (monthFilter !== "all") result = result.filter((a) => a.month === monthFilter);

    if (statusFilter === "top_earnings") result = result.filter((a) => top10EarningsNames.has(a.fileName));
    else if (statusFilter === "top_downloads") result = result.filter((a) => top10DownloadsNames.has(a.fileName));
    else if (statusFilter === "zero") result = result.filter((a) => zeroDownloadsNames.has(a.fileName));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.fileName.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.assetId.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      if (sortKey === "earnings") { av = a.earnings; bv = b.earnings; }
      else if (sortKey === "downloads") { av = a.downloads; bv = b.downloads; }
      else if (sortKey === "fileName") { av = a.fileName; bv = b.fileName; }
      else if (sortKey === "assetType") { av = a.assetType; bv = b.assetType; }
      else { av = a.month; bv = b.month; }

      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assets, typeFilter, monthFilter, statusFilter, search, sortKey, sortDir, top10EarningsNames, top10DownloadsNames, zeroDownloadsNames]);

  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-text-muted" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />;
  };

  const resetFilters = () => {
    setSearch(""); setTypeFilter("all"); setMonthFilter("all"); setStatusFilter("all"); setPage(0);
  };
  const hasActiveFilters = search || typeFilter !== "all" || monthFilter !== "all" || statusFilter !== "all";

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <SectionHeader
          title="Rendimiento de Assets"
          subtitle={`${formatNumber(filtered.length)} de ${formatNumber(assets.length)} registros`}
        />
        <ExportAIButton assets={assets} />
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-5">
        {/* Busqueda */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full bg-surface-1 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-text-muted hover:text-danger transition-colors px-2 py-1 rounded border border-border hover:border-danger/30"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtro de tipo */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-text-muted w-10 shrink-0">Tipo:</span>
          {assetTypes.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(0); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-500 transition-all border",
                typeFilter === t
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-surface-1 text-text-secondary border-border hover:border-accent/20"
              )}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>

        {/* Filtro de mes */}
        {months.length > 2 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-text-muted w-10 shrink-0">Mes:</span>
            {months.map((m) => (
              <button
                key={m}
                onClick={() => { setMonthFilter(m); setPage(0); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-500 transition-all border",
                  monthFilter === m
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-surface-1 text-text-secondary border-border hover:border-accent/20"
                )}
              >
                {m === "all" ? "Todos" : m}
              </button>
            ))}
          </div>
        )}

        {/* Filtro de estado */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-text-muted w-10 shrink-0">Estado:</span>
          {(
            [
              { key: "all", label: "Todos" },
              { key: "top_earnings", label: "Top Ganancias" },
              { key: "top_downloads", label: "Top Descargas" },
              { key: "zero", label: "Sin Descargas" },
            ] as { key: StatusFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(0); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-500 transition-all border",
                statusFilter === key
                  ? key === "zero"
                    ? "bg-danger/10 text-danger border-danger/20"
                    : key === "top_earnings"
                    ? "bg-warning/10 text-warning border-warning/20"
                    : key === "top_downloads"
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-accent/10 text-accent border-accent/20"
                  : "bg-surface-1 text-text-secondary border-border hover:border-accent/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5"><Trophy size={11} className="text-warning" /> Top 10 Ganancias</span>
        <span className="flex items-center gap-1.5"><TrendingUp size={11} className="text-accent" /> Top 10 Descargas</span>
        <span className="flex items-center gap-1.5"><AlertCircle size={11} className="text-danger" /> Sin Descargas</span>
      </div>

      {/* Tabla */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {(
                  [
                    { key: "fileName" as SortKey, label: "Nombre del Asset" },
                    { key: "assetType" as SortKey, label: "Tipo" },
                    { key: "downloads" as SortKey, label: "Descargas" },
                    { key: "earnings" as SortKey, label: "Ganancias" },
                    { key: "month" as SortKey, label: "Mes" },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left text-xs font-500 text-text-muted cursor-pointer hover:text-text-secondary transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {label} <SortIcon k={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-500 text-text-muted">Enlace</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((asset) => {
                const isTopE = top10EarningsNames.has(asset.fileName);
                const isTopD = top10DownloadsNames.has(asset.fileName);
                const isZero = zeroDownloadsNames.has(asset.fileName);
                return (
                  <tr
                    key={`${asset.assetId}-${asset.month}`}
                    className={cn(
                      "border-b border-border/50 table-row-hover transition-colors",
                      isTopE ? HIGHLIGHT.topEarnings : isTopD ? HIGHLIGHT.topDownloads : isZero ? HIGHLIGHT.zero : ""
                    )}
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-text-primary truncate font-400">{asset.fileName}</p>
                      {asset.description && (
                        <p className="text-xs text-text-muted truncate mt-0.5">{asset.description.slice(0, 60)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary">
                        {asset.assetType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-500 tabular-nums">
                      {formatNumber(asset.downloads)}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-500 tabular-nums">
                      {formatCurrency(asset.earnings)}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs tabular-nums">{asset.month}</td>
                    <td className="px-4 py-3">
                      {asset.url ? (
                        <a href={asset.url} target="_blank" rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      ) : <span className="text-text-muted/30">—</span>}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                    No se encontraron assets con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {formatNumber(filtered.length)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs rounded-lg bg-surface-2 text-text-secondary disabled:opacity-30 hover:bg-surface-3 transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs text-text-muted">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1 text-xs rounded-lg bg-surface-2 text-text-secondary disabled:opacity-30 hover:bg-surface-3 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
