"use client";

import { useStore } from "@/hooks/useStore";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { assets, uploadedFiles, removeFile, clearAll } = useStore();

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar
        uploadedFiles={uploadedFiles}
        onRemoveFile={removeFile}
        onClearAll={clearAll}
        totalAssets={assets.length}
      />
      <main className="flex-1 overflow-auto">
        <div className="bg-grid min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
