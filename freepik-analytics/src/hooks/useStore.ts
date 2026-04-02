"use client";

import { useState, useEffect, useCallback } from "react";
import type { Asset, UploadedFile } from "@/types";

const STORAGE_KEY = "freepik_analytics_data";

interface Store {
  assets: Asset[];
  uploadedFiles: UploadedFile[];
}

function loadFromStorage(): Store {
  if (typeof window === "undefined") return { assets: [], uploadedFiles: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { assets: [], uploadedFiles: [] };
    return JSON.parse(raw);
  } catch {
    return { assets: [], uploadedFiles: [] };
  }
}

function saveToStorage(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable
  }
}

export function useStore() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    setAssets(stored.assets);
    setUploadedFiles(stored.uploadedFiles);
    setHydrated(true);
  }, []);

  const addAssets = useCallback(
    (newAssets: Asset[], file: UploadedFile) => {
      setAssets((prev) => {
        // Usar fileName + month como clave unica para evitar duplicados del mismo archivo en el mismo mes
        // Pero permitir el mismo archivo en diferentes meses (diferentes reportes CSV)
        const existingKeys = new Set(prev.map((a) => `${a.fileName}::${a.month}`));
        const unique = newAssets.filter((a) => !existingKeys.has(`${a.fileName}::${a.month}`));
        const merged = [...prev, ...unique];
        const newFiles = [...uploadedFiles, file];
        saveToStorage({ assets: merged, uploadedFiles: newFiles });
        return merged;
      });
      setUploadedFiles((prev) => {
        const updated = [...prev, file];
        return updated;
      });
    },
    [uploadedFiles]
  );

  const clearAll = useCallback(() => {
    setAssets([]);
    setUploadedFiles([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeFile = useCallback(
    (fileName: string) => {
      setAssets((prev) => {
        const updated = prev.filter((a) => a.sourceFile !== fileName);
        const newFiles = uploadedFiles.filter((f) => f.name !== fileName);
        saveToStorage({ assets: updated, uploadedFiles: newFiles });
        return updated;
      });
      setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    },
    [uploadedFiles]
  );

  return { assets, uploadedFiles, addAssets, clearAll, removeFile, hydrated };
}
