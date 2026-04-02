"use client";

import { useStore } from "@/hooks/useStore";
import { UploadZone } from "@/components/ui/UploadZone";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber } from "@/lib/parser";
import { FileText, Trash2, Clock } from "lucide-react";

export function UploadPage() {
  const { assets, uploadedFiles, addAssets, removeFile, clearAll, hydrated } = useStore();

  if (!hydrated) return null;

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Upload CSV Files"
        subtitle="Import your Freepik contributor monthly exports"
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
              Uploaded files ({uploadedFiles.length})
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              Clear all data
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
                      {new Date(f.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-text-muted">{formatNumber(f.rowCount)} rows</span>
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
            Total: {formatNumber(assets.length)} unique assets in memory
          </p>
        </div>
      )}

      {/* CSV format help */}
      <div className="mt-8 card-base p-5">
        <p className="text-sm font-500 text-text-secondary mb-3">Expected CSV Format</p>
        <p className="text-xs text-text-muted mb-3">
          The parser auto-detects column names. Supported variants include:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["asset id / id / file id", "Asset identifier"],
            ["file name / name / title", "Asset name"],
            ["downloads / nb downloads", "Download count"],
            ["earnings / revenue / amount", "Revenue earned"],
            ["type / asset type / category", "Asset category"],
            ["description / keywords / tags", "Keywords"],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-2">
              <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent font-mono text-[11px]">{col}</code>
              <span className="text-text-muted">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3 opacity-70">
          Month is extracted from the filename (e.g. <code className="font-mono">2024-03.csv</code> or <code className="font-mono">march_2024.csv</code>).
        </p>
      </div>
    </div>
  );
}
