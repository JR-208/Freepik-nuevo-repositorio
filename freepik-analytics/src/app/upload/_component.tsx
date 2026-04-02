"use client";

import { useStore } from "@/hooks/useStore";
import { UploadZone } from "@/components/ui/UploadZone";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber } from "@/lib/parser";
import { FileText, Trash2, Clock } from "lucide-react";

export function UploadPage() {
  const { assets, uploadedFiles, addAssets, removeFile, clearAll, hydrated } = useStore();

  // Contar assets unicos
  const uniqueAssets = new Set(assets.map((a) => a.fileName)).size;

  if (!hydrated) return null;

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Subir Archivos CSV"
        subtitle="Importa tus exportaciones mensuales de Freepik"
      />

      <UploadZone
        existingAssets={assets}
        uploadedFileNames={uploadedFiles.map((f) => f.name)}
        onUpload={addAssets}
      />

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-500 text-text-secondary">
              Archivos subidos ({uploadedFiles.length})
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              Borrar todos los datos
            </button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((f) => (
              <div key={f.name} className="card-base px-4 py-3 flex items-center gap-3">
                <FileText size={14} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{f.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(f.uploadedAt).toLocaleDateString("es-ES")}
                    </span>
                    <span className="text-xs text-text-muted">{formatNumber(f.rowCount)} filas</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-text-muted hover:text-danger transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3">
            Total: {formatNumber(uniqueAssets)} assets unicos en memoria
          </p>
        </div>
      )}

      {/* CSV format help */}
      <div className="mt-8 card-base p-5">
        <p className="text-sm font-500 text-text-secondary mb-3">Formato de CSV Esperado</p>
        <p className="text-xs text-text-muted mb-3">
          El parser auto-detecta los nombres de columna. Variantes soportadas incluyen:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["asset id / freepik asset id", "Identificador del asset"],
            ["file name / name / title", "Nombre del asset"],
            ["freepik downloads / downloads", "Conteo de descargas"],
            ["freepik earnings eur / earnings", "Ganancias obtenidas"],
            ["type / asset type / category", "Categoria del asset"],
            ["description / keywords / tags", "Palabras clave"],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-2">
              <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent font-mono text-[11px]">{col}</code>
              <span className="text-text-muted">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3 opacity-70">
          El mes se extrae del nombre del archivo (ej. <code className="font-mono">2024-03.csv</code> o <code className="font-mono">march_2024.csv</code>).
        </p>
      </div>
    </div>
  );
}
