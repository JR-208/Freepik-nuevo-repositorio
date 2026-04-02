"use client";

import Link from "next/link";
import { Upload, BarChart3 } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-6 animate-pulse-soft">
        <BarChart3 size={32} className="text-text-muted" />
      </div>
      <h2 className="text-xl font-600 text-text-primary mb-2">Sin datos aun</h2>
      <p className="text-sm text-text-secondary mb-8 max-w-sm">
        Sube tus archivos CSV de exportacion de Freepik para comenzar a analizar tus datos de rendimiento.
      </p>
      <Link
        href="/upload"
        className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl text-sm font-500 transition-all"
      >
        <Upload size={15} />
        Subir archivos CSV
      </Link>
    </div>
  );
}
