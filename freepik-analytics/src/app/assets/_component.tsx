"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Search, Trophy, AlertCircle } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatCurrency, formatNumber } from "@/lib/parser";
import { cn } from "@/lib/cn";
import type { Asset } from "@/types";

type SortKey = keyof Pick<Asset, "fileName" | "assetType" | "downloads" | "earnings">;
type SortDir = "asc" | "desc";

const HIGHLIGHT = {
  topEarnings: "border-l-2 border-l-warning",
  topDownloads: "border-l-2 border-l-accent",
  zero: "border-l-2 border-l-danger opacity-60",
};

export function AssetsPage() {
  const { assets, hydrated } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("earnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const assetTypes = useMemo(() => {
    const types = [...new Set(assets.map((a) => a.assetType))].sort();
    return ["all", ...types];
  }, [assets]);

  const top10Earnings = useMemo(() => {
    const ids = new Set(
      [...assets].sort((a, b) => b.earnings - a.earnings).slice(0, 10).map((a) => a.assetId)
    );
    return ids;
  }, [assets]);

  const top10Downloads = useMemo(() => {
    const ids = new Set(
      [...assets].sort((a, b) => b.downloads - a.downloads).slice(0, 10).map((a) => a.assetId)
    );
    return ids;
  }, [assets]);

  const filtered = useMemo(() => {
    let result = assets;
    if (typeFilter !== "all") result = result.filter((a) => a.assetType === typeFilter);
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
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [assets, typeFilter, search, sortKey, sortDir]);

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

  if (!hydrated) return null;
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="p-8">
      <SectionHeader
        title="Rendimiento de Assets"
        subtitle={`${formatNumber(assets.length)} registros totales`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar assets..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-surface-1 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {assetTypes.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(0); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-500 transition-all",
                typeFilter === t
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-surface-1 text-text-secondary border border-border hover:border-accent/20"
              )}
            >
              {t === "all" ? "Todos los Tipos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5"><Trophy size={11} className="text-warning" /> Top 10 Ganancias</span>
        <span className="flex items-center gap-1.5"><Trophy size={11} className="text-accent" /> Top 10 Descargas</span>
        <span className="flex items-center gap-1.5"><AlertCircle size={11} className="text-danger" /> Sin Descargas</span>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: "fileName" as SortKey, label: "Nombre del Asset" },
                  { key: "assetType" as SortKey, label: "Tipo" },
                  { key: "downloads" as SortKey, label: "Descargas" },
                  { key: "earnings" as SortKey, label: "Ganancias" },
                ].map(({ key, label }) => (
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
                <th className="px-4 py-3 text-left text-xs font-500 text-text-muted">Mes</th>
                <th className="px-4 py-3 text-left text-xs font-500 text-text-muted">Enlace</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((asset) => {
                const isTopE = top10Earnings.has(asset.assetId);
                const isTopD = top10Downloads.has(asset.assetId);
                const isZero = asset.downloads === 0;
                return (
                  <tr
                    key={asset.assetId}
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
                    <td className="px-4 py-3 text-text-muted text-xs">{asset.month}</td>
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
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
