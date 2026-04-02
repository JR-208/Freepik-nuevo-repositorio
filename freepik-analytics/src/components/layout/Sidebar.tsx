"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Package, Search, TrendingUp,
  Lightbulb, Upload, Trash2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { UploadedFile } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/types", label: "Tipos de Asset", icon: BarChart3 },
  { href: "/keywords", label: "Palabras Clave", icon: Search },
  { href: "/growth", label: "Crecimiento", icon: TrendingUp },
  { href: "/insights", label: "Estadisticas", icon: Lightbulb },
];

interface SidebarProps {
  uploadedFiles: UploadedFile[];
  onRemoveFile: (name: string) => void;
  onClearAll: () => void;
  totalAssets: number;
}

export function Sidebar({ uploadedFiles, onRemoveFile, onClearAll, totalAssets }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 border-r border-border bg-surface-1">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <BarChart3 size={14} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-600 text-text-primary tracking-tight">Contributor</p>
            <p className="text-xs text-text-muted leading-none">Analytics</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs text-text-muted uppercase tracking-widest px-2 mb-3 font-500">Panel</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                active
                  ? "bg-accent/10 text-accent font-500"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              )}
            >
              <Icon size={15} className={cn(active ? "text-accent" : "text-text-muted group-hover:text-text-secondary")} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-accent/60" />}
            </Link>
          );
        })}

        {/* Files section */}
        <div className="pt-6">
          <p className="text-xs text-text-muted uppercase tracking-widest px-2 mb-3 font-500">
            Archivos ({uploadedFiles.length})
          </p>
          {uploadedFiles.length === 0 ? (
            <p className="text-xs text-text-muted px-2">Sin archivos subidos</p>
          ) : (
            <div className="space-y-1">
              {uploadedFiles.map((f) => (
                <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  <p className="text-xs text-text-secondary truncate flex-1">{f.name}</p>
                  <button
                    onClick={() => onRemoveFile(f.name)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {totalAssets > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-text-muted">{totalAssets.toLocaleString()} assets</span>
            <button
              onClick={onClearAll}
              className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              Borrar todo
            </button>
          </div>
        )}
        <Link
          href="/upload"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-all",
            pathname === "/upload"
              ? "bg-accent/10 text-accent"
              : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3"
          )}
        >
          <Upload size={14} />
          <span>Subir CSV</span>
        </Link>
      </div>
    </aside>
  );
}
