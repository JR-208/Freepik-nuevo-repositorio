"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { parseCSV, mergeAssets } from "@/lib/parser";
import { cn } from "@/lib/cn";
import type { Asset, UploadedFile } from "@/types";

interface UploadZoneProps {
  existingAssets: Asset[];
  uploadedFileNames: string[];
  onUpload: (assets: Asset[], file: UploadedFile) => void;
}

interface FileStatus {
  name: string;
  status: "parsing" | "done" | "error" | "duplicate";
  count?: number;
  error?: string;
}

export function UploadZone({ existingAssets, uploadedFileNames, onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const name = file.name;

      if (uploadedFileNames.includes(name)) {
        setFileStatuses((prev) => [...prev, { name, status: "duplicate" }]);
        return;
      }

      setFileStatuses((prev) => [...prev, { name, status: "parsing" }]);

      try {
        const text = await file.text();
        const parsed = parseCSV(text, name);

        if (parsed.length === 0) {
          setFileStatuses((prev) =>
            prev.map((s) => s.name === name ? { ...s, status: "error", error: "No se encontraron filas validas" } : s)
          );
          return;
        }

        const tagged = parsed.map((a) => ({ ...a, sourceFile: name }));
        const merged = mergeAssets(existingAssets, tagged, name);
        const newCount = merged.length - existingAssets.length;

        onUpload(tagged, {
          name,
          uploadedAt: new Date().toISOString(),
          rowCount: parsed.length,
        });

        setFileStatuses((prev) =>
          prev.map((s) => s.name === name ? { ...s, status: "done", count: newCount } : s)
        );
      } catch (e) {
        setFileStatuses((prev) =>
          prev.map((s) => s.name === name ? { ...s, status: "error", error: String(e) } : s)
        );
      }
    },
    [existingAssets, uploadedFileNames, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
      files.forEach(processFile);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(processFile);
      if (inputRef.current) inputRef.current.value = "";
    },
    [processFile]
  );

  const removeStatus = (name: string) => {
    setFileStatuses((prev) => prev.filter((s) => s.name !== name));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
          dragging
            ? "border-accent bg-accent/5 scale-[1.01]"
            : "border-border hover:border-accent/40 hover:bg-surface-2/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <div className={cn(
          "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all",
          dragging ? "bg-accent/20" : "bg-surface-2"
        )}>
          <Upload size={24} className={dragging ? "text-accent" : "text-text-muted"} />
        </div>
        <p className="text-text-primary font-500 mb-1">
          {dragging ? "Suelta tus archivos CSV aqui" : "Arrastra y suelta archivos CSV"}
        </p>
        <p className="text-sm text-text-muted">
          o haz clic para buscar - Multiples archivos soportados
        </p>
        <p className="text-xs text-text-muted mt-3 opacity-60">
          Soporta exportaciones de Freepik - Auto-detecta el formato
        </p>
      </div>

      {/* File statuses */}
      {fileStatuses.length > 0 && (
        <div className="space-y-2">
          {fileStatuses.map((s) => (
            <div key={s.name} className="card-base px-4 py-3 flex items-center gap-3">
              <FileText size={14} className="text-text-muted shrink-0" />
              <p className="text-sm text-text-secondary flex-1 truncate">{s.name}</p>
              <div className="flex items-center gap-2 shrink-0">
                {s.status === "parsing" && (
                  <Loader2 size={14} className="text-accent animate-spin" />
                )}
                {s.status === "done" && (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle size={13} />
                    {s.count} nuevos assets
                  </span>
                )}
                {s.status === "error" && (
                  <span className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle size={13} />
                    {s.error || "Error al parsear"}
                  </span>
                )}
                {s.status === "duplicate" && (
                  <span className="text-xs text-warning">Ya subido</span>
                )}
                <button onClick={() => removeStatus(s.name)} className="text-text-muted hover:text-text-secondary">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
