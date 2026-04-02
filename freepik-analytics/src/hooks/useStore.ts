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
        const existingIds = new Set(prev.map((a) => a.assetId));
        const unique = newAssets.filter((a) => !existingIds.has(a.assetId));
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
