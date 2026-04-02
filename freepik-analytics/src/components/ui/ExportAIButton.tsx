"use client";

import { useState } from "react";
import { BrainCircuit, Download, FileJson, FileText, ChevronDown } from "lucide-react";
import { buildAIExport, buildAIPrompt } from "@/lib/parser";
import type { Asset } from "@/types";
import { cn } from "@/lib/cn";

interface Props {
  assets: Asset[];
}

export function ExportAIButton({ assets }: Props) {
  const [open, setOpen] = useState(false);

  function downloadJSON() {
    const data = buildAIExport(assets);
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freepik-ia-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function downloadTXT() {
    const prompt = buildAIPrompt(assets);
    if (!prompt) return;
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freepik-prompt-ia-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  if (assets.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-500 transition-all border",
          "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
        )}
      >
        <BrainCircuit size={14} />
        Exportar para IA
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-56 bg-surface-1 border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-text-muted">Exportar datos procesados</p>
            </div>
            <button
              onClick={downloadJSON}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors text-left"
            >
              <FileJson size={14} className="text-accent shrink-0" />
              <div>
                <p className="font-500 text-xs">JSON estructurado</p>
                <p className="text-xs text-text-muted">Para procesar con otra IA</p>
              </div>
              <Download size={11} className="ml-auto text-text-muted" />
            </button>
            <button
              onClick={downloadTXT}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors text-left"
            >
              <FileText size={14} className="text-warning shrink-0" />
              <div>
                <p className="font-500 text-xs">Prompt para ChatGPT</p>
                <p className="text-xs text-text-muted">Analisis y recomendaciones</p>
              </div>
              <Download size={11} className="ml-auto text-text-muted" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
