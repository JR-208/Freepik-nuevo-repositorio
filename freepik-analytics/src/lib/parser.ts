import Papa from "papaparse";
import type { Asset, UploadedFile } from "@/types";

const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","through","during","this","that","these",
  "those","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "can","need","dare","ought","used","it","its","i","my","we","our","you",
  "your","he","his","she","her","they","their","what","which","who","whom",
  "when","where","why","how","all","each","every","both","few","more","most",
  "other","some","such","no","nor","not","only","same","so","than","too",
  "very","just","because","as","while","although","though","after","before",
  "since","until","unless","if","else","then","also","any","file","image",
  "photo","vector","design","template","element","set","collection","pack",
  "isolated","background","white","black","color","style","flat","icon",
  "icons","graphic","art","illustration","stock","free","download","high",
  "quality","resolution","eps","jpg","jpeg","png","svg","psd","object",
  "objects","concept","abstract","modern","simple","new","type","color",
]);

function extractMonth(filename: string): string {
  // Try MM_YYYY or MM-YYYY pattern (e.g., "assets_report_03_2026" -> "2026-03")
  const m0 = filename.match(/(\d{2})[_\-](\d{4})/);
  if (m0) {
    const month = m0[1];
    const year = m0[2];
    // Validate month is between 01 and 12
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${year}-${month}`;
    }
  }
  
  // Try YYYY-MM or YYYY_MM pattern (e.g., "2024-03" or "2024_03")
  const m1 = filename.match(/(\d{4})[_\-](\d{2})/);
  if (m1) {
    const year = m1[1];
    const month = m1[2];
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${year}-${month}`;
    }
  }
  
  // Try month name + year
  const months: Record<string, string> = {
    january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
    july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
    jan:"01",feb:"02",mar:"03",apr:"04",jun:"06",jul:"07",aug:"08",
    sep:"09",oct:"10",nov:"11",dec:"12",
  };
  const lower = filename.toLowerCase();
  for (const [name, num] of Object.entries(months)) {
    const r = new RegExp(`${name}[_\\-\\s]*(\\d{4})`);
    const m2 = lower.match(r);
    if (m2) return `${m2[1]}-${num}`;
    const r2 = new RegExp(`(\\d{4})[_\\-\\s]*${name}`);
    const m3 = lower.match(r2);
    if (m3) return `${m3[1]}-${num}`;
  }
  // fallback: current month
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeRow(row: Record<string, string>, month: string): Asset | null {
  // Map common column name variants
  const get = (keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (rk) => rk.toLowerCase().trim() === k.toLowerCase()
      );
      if (found && row[found] !== undefined && row[found] !== "") return row[found].trim();
    }
    return "";
  };

  const assetId = get(["asset id","assetid","id","asset_id","file id","fileid","freepik asset id"]);
  const fileName = get(["file name","filename","name","title","file_name","asset name"]);
  const description = get(["description","desc","keywords","tags","keyword"]);
  const url = get(["url","link","asset url","file url","download url","asset public url"]);
  const assetType = get(["type","asset type","file type","assettype","category","format"]) || "Unknown";

  const rawDownloads = get(["downloads","download","total downloads","nb downloads","num downloads","freepik downloads"]);
  const rawEarnings = get(["earnings","revenue","amount","total earnings","income","total revenue","earning","freepik earnings eur","freepik earnings"]);

  const downloads = parseInt(rawDownloads.replace(/[^0-9]/g, ""), 10) || 0;
  const earnings = parseFloat(rawEarnings.replace(/[^0-9.]/g, "")) || 0;

  // Skip rows with no identifying data
  if (!assetId && !fileName && !url) return null;

  return {
    assetId: assetId || `${fileName}-${month}`,
    fileName: fileName || assetId || "Unknown",
    description,
    url,
    assetType: assetType.charAt(0).toUpperCase() + assetType.slice(1).toLowerCase(),
    downloads,
    earnings,
    month,
    sourceFile: "",
  };
}

function detectAndParseSingleColumn(raw: string, month: string): Asset[] {
  // If all data landed in one column, try splitting by comma or semicolon
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  
  // Detect delimiter in first line
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  let delimiter = ",";
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
  if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";

  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return result.data
    .map((row) => normalizeRow(row, month))
    .filter((a): a is Asset => a !== null);
}

export function parseCSV(content: string, filename: string): Asset[] {
  const month = extractMonth(filename);

  // First attempt: auto-detect
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0 || result.meta.fields?.length === 1) {
    // Possibly single-column or bad format
    return detectAndParseSingleColumn(content, month);
  }

  const assets = result.data
    .map((row) => normalizeRow(row, month))
    .filter((a): a is Asset => a !== null);

  return assets;
}

export function mergeAssets(existing: Asset[], incoming: Asset[], sourceFile: string): Asset[] {
  const tagged = incoming.map((a) => ({ ...a, sourceFile }));
  const existingIds = new Set(existing.map((a) => a.assetId));
  const deduped = tagged.filter((a) => !existingIds.has(a.assetId));
  return [...existing, ...deduped];
}

export function extractKeywords(assets: Asset[]): { keyword: string; count: number; earnings: number; downloads: number }[] {
  const map = new Map<string, { count: number; earnings: number; downloads: number }>();

  for (const asset of assets) {
    const text = `${asset.description} ${asset.fileName}`.toLowerCase();
    const words = text
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));

    const seen = new Set<string>();
    const unique = words.filter((w) => { if (seen.has(w)) return false; seen.add(w); return true; });
    for (const word of unique) {
      const existing = map.get(word) || { count: 0, earnings: 0, downloads: 0 };
      map.set(word, {
        count: existing.count + 1,
        earnings: existing.earnings + asset.earnings,
        downloads: existing.downloads + asset.downloads,
      });
    }
  }

  return Array.from(map.entries())
    .map(([keyword, data]) => ({ keyword, ...data }))
    .filter((k) => k.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

export function aggregateByMonth(assets: Asset[]) {
  // Agrupar assets por mes
  const map = new Map<string, { earnings: number; downloads: number; assetCount: number }>();

  for (const asset of assets) {
    const existing = map.get(asset.month) || { earnings: 0, downloads: 0, assetCount: 0 };
    map.set(asset.month, {
      earnings: existing.earnings + asset.earnings,
      downloads: existing.downloads + asset.downloads,
      assetCount: existing.assetCount + 1,
    });
  }

  // Ordenar meses cronologicamente
  const sortedMonths = Array.from(map.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calcular nuevos assets por mes (assets que aparecen por primera vez en ese mes)
  const seenAssets = new Set<string>();
  const result = sortedMonths.map((monthData) => {
    const monthAssets = assets.filter((a) => a.month === monthData.month);
    let newAssets = 0;
    for (const asset of monthAssets) {
      if (!seenAssets.has(asset.fileName)) {
        seenAssets.add(asset.fileName);
        newAssets++;
      }
    }
    return { ...monthData, newAssets };
  });

  return result;
}

export function aggregateByType(assets: Asset[]) {
  const map = new Map<string, { earnings: number; downloads: number; count: number }>();

  for (const asset of assets) {
    const type = asset.assetType || "Unknown";
    const existing = map.get(type) || { earnings: 0, downloads: 0, count: 0 };
    map.set(type, {
      earnings: existing.earnings + asset.earnings,
      downloads: existing.downloads + asset.downloads,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([type, data]) => ({
      type,
      ...data,
      earningsPerDownload: data.downloads > 0 ? data.earnings / data.downloads : 0,
    }))
    .sort((a, b) => b.earnings - a.earnings);
}

export function generateInsights(assets: Asset[]) {
  const insights = [];
  const total = assets.length;
  if (total === 0) return [];

  // 80/20 rule
  const sorted = [...assets].sort((a, b) => b.earnings - a.earnings);
  const top20Count = Math.ceil(total * 0.2);
  const top20Earnings = sorted.slice(0, top20Count).reduce((s, a) => s + a.earnings, 0);
  const totalEarnings = assets.reduce((s, a) => s + a.earnings, 0);
  if (totalEarnings > 0) {
    const pct = Math.round((top20Earnings / totalEarnings) * 100);
    insights.push({
      id: "pareto",
      type: "neutral" as const,
      title: "Principio de Pareto",
      description: `Tu top 20% de assets (${top20Count} archivos) genera el ${pct}% de los ingresos totales.`,
      value: `${pct}%`,
    });
  }

  // Zero downloads
  const zeroDL = assets.filter((a) => a.downloads === 0).length;
  if (zeroDL > 0) {
    insights.push({
      id: "zero_downloads",
      type: zeroDL > total * 0.3 ? ("warning" as const) : ("neutral" as const),
      title: "Assets sin Descargas",
      description: `${zeroDL} asset${zeroDL > 1 ? "s no han" : " no ha"} sido descargado${zeroDL > 1 ? "s" : ""}. Considera mejorar titulos o descripciones.`,
      value: `${zeroDL}`,
    });
  }

  // Best asset type
  const byType = aggregateByType(assets);
  if (byType.length > 0) {
    const best = byType[0];
    insights.push({
      id: "best_type",
      type: "positive" as const,
      title: "Mejor Tipo de Asset",
      description: `"${best.type}" es tu mejor categoria con ${formatCurrency(best.earnings)} en ganancias totales en ${best.count} assets.`,
      value: best.type,
    });
  }

  // Best earning per download type
  const byEPD = [...byType].filter((t) => t.downloads > 5).sort((a, b) => b.earningsPerDownload - a.earningsPerDownload);
  if (byEPD.length > 0) {
    const best = byEPD[0];
    insights.push({
      id: "best_epd",
      type: "tip" as const,
      title: "Mayor Ingreso por Descarga",
      description: `"${best.type}" genera ${formatCurrency(best.earningsPerDownload)} por descarga - tu categoria mas eficiente.`,
      value: formatCurrency(best.earningsPerDownload),
    });
  }

  // Keyword insights
  const keywords = extractKeywords(assets);
  if (keywords.length > 0) {
    const topKw = keywords.sort((a, b) => b.earnings - a.earnings)[0];
    const avgEarnings = totalEarnings / total;
    const kwAssets = assets.filter((a) =>
      (a.description + a.fileName).toLowerCase().includes(topKw.keyword)
    );
    const kwAvg = kwAssets.length > 0
      ? kwAssets.reduce((s, a) => s + a.earnings, 0) / kwAssets.length
      : 0;
    if (kwAvg > avgEarnings && kwAssets.length >= 3) {
      const pct = Math.round(((kwAvg - avgEarnings) / avgEarnings) * 100);
      insights.push({
        id: "keyword",
        type: "positive" as const,
        title: `Palabra clave "${topKw.keyword}" destaca`,
        description: `Los assets con "${topKw.keyword}" generan ${pct}% mas que tu asset promedio.`,
        value: `+${pct}%`,
      });
    }
  }

  // Growth trend
  const monthly = aggregateByMonth(assets);
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (prev.earnings > 0) {
      const growth = ((last.earnings - prev.earnings) / prev.earnings) * 100;
      if (Math.abs(growth) > 5) {
        insights.push({
          id: "growth",
          type: growth > 0 ? ("positive" as const) : ("warning" as const),
          title: "Tendencia Mensual",
          description: `Tu ultimo mes registrado mostro ${growth > 0 ? "+" : ""}${growth.toFixed(1)}% de cambio en ganancias vs el mes anterior.`,
          value: `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`,
        });
      }
    }
  }

  // Recommendation
  if (byType.length >= 2) {
    const underperforming = byType.filter(
      (t) => t.count >= 3 && t.earningsPerDownload < byType[0].earningsPerDownload * 0.3
    );
    if (underperforming.length > 0) {
      insights.push({
        id: "recommendation",
        type: "tip" as const,
        title: "Oportunidad de Reasignacion",
        description: `Considera crear mas assets "${byType[0].type}" y menos "${underperforming[0].type}" - la diferencia de ingresos es significativa.`,
        value: "Consejo",
      });
    }
  }

  return insights;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

// ── Exportacion para IA ────────────────────────────────────────────────────

export function buildAIExport(assets: Asset[]) {
  if (assets.length === 0) return null;

  const totalEarnings = assets.reduce((s, a) => s + a.earnings, 0);
  const totalDownloads = assets.reduce((s, a) => s + a.downloads, 0);
  const months = [...new Set(assets.map((a) => a.month))].sort();

  // Agregar por nombre de archivo (mismo asset en distintos meses)
  const byFile = new Map<string, { fileName: string; assetType: string; earnings: number; downloads: number; months: string[] }>();
  for (const a of assets) {
    const prev = byFile.get(a.fileName) ?? { fileName: a.fileName, assetType: a.assetType, earnings: 0, downloads: 0, months: [] };
    byFile.set(a.fileName, {
      ...prev,
      earnings: prev.earnings + a.earnings,
      downloads: prev.downloads + a.downloads,
      months: prev.months.includes(a.month) ? prev.months : [...prev.months, a.month].sort(),
    });
  }
  const allFiles = [...byFile.values()];
  const sorted = [...allFiles].sort((a, b) => b.earnings - a.earnings);

  // Top items
  const top_items = sorted.slice(0, 10).map((a, i) => ({
    posicion: i + 1,
    nombre: a.fileName,
    tipo: a.assetType,
    ganancias_eur: parseFloat(a.earnings.toFixed(4)),
    descargas: a.downloads,
    ingreso_por_descarga: a.downloads > 0 ? parseFloat((a.earnings / a.downloads).toFixed(4)) : 0,
    meses_activo: a.months.length,
  }));

  // Tendencias mensuales
  const monthly = aggregateByMonth(assets);
  const tendencias = monthly.map((m, i) => {
    const prev = monthly[i - 1];
    const delta = prev && prev.earnings > 0 ? ((m.earnings - prev.earnings) / prev.earnings) * 100 : null;
    return {
      mes: m.month,
      ganancias_eur: parseFloat(m.earnings.toFixed(4)),
      descargas: m.downloads,
      assets_nuevos: m.newAssets,
      cambio_pct: delta !== null ? parseFloat(delta.toFixed(1)) : null,
    };
  });

  // Por tipo
  const byType = aggregateByType(assets);

  // Oportunidades
  const zeroDL = allFiles.filter((a) => a.downloads === 0);
  const avgEarnings = totalEarnings / allFiles.length;
  const topType = byType[0];
  const worstType = [...byType].filter((t) => t.count >= 2).sort((a, b) => a.earningsPerDownload - b.earningsPerDownload)[0];

  const oportunidades: { tipo: string; descripcion: string }[] = [];
  if (zeroDL.length > 0) {
    oportunidades.push({
      tipo: "sin_descargas",
      descripcion: `${zeroDL.length} assets nunca han sido descargados. Revisar titulos, descripciones y keywords podria aumentar su visibilidad.`,
    });
  }
  if (topType) {
    oportunidades.push({
      tipo: "tipo_estrella",
      descripcion: `El tipo "${topType.type}" tiene el mayor rendimiento (${topType.earnings.toFixed(2)} EUR). Crear mas contenido de este tipo podria aumentar ingresos.`,
    });
  }
  if (worstType && topType && worstType.type !== topType.type) {
    oportunidades.push({
      tipo: "reasignacion",
      descripcion: `El tipo "${worstType.type}" tiene bajo ingreso por descarga (${worstType.earningsPerDownload.toFixed(4)} EUR/descarga). Considera redirigir esfuerzo hacia "${topType.type}".`,
    });
  }
  const lastTwo = monthly.slice(-2);
  if (lastTwo.length === 2 && lastTwo[0].earnings > 0) {
    const growth = ((lastTwo[1].earnings - lastTwo[0].earnings) / lastTwo[0].earnings) * 100;
    if (growth < -10) {
      oportunidades.push({
        tipo: "caida_ingresos",
        descripcion: `Los ingresos cayeron ${Math.abs(growth).toFixed(1)}% en el ultimo mes. Analizar que assets perdieron descargas podria identificar la causa.`,
      });
    } else if (growth > 10) {
      oportunidades.push({
        tipo: "crecimiento",
        descripcion: `Los ingresos crecieron ${growth.toFixed(1)}% en el ultimo mes. Identificar que assets impulsaron ese crecimiento y replicar su estrategia.`,
      });
    }
  }

  return {
    resumen_general: {
      total_assets_unicos: allFiles.length,
      total_registros: assets.length,
      meses_analizados: months.length,
      rango_temporal: months.length > 0 ? `${months[0]} a ${months[months.length - 1]}` : "—",
      ganancias_totales_eur: parseFloat(totalEarnings.toFixed(4)),
      descargas_totales: totalDownloads,
      ingreso_promedio_por_asset: parseFloat((totalEarnings / (allFiles.length || 1)).toFixed(4)),
      assets_sin_descargas: zeroDL.length,
      por_tipo: byType.map((t) => ({
        tipo: t.type,
        assets: t.count,
        ganancias_eur: parseFloat(t.earnings.toFixed(4)),
        descargas: t.downloads,
        eur_por_descarga: parseFloat(t.earningsPerDownload.toFixed(4)),
      })),
    },
    top_items,
    tendencias,
    oportunidades,
  };
}

export function buildAIPrompt(assets: Asset[]): string {
  const data = buildAIExport(assets);
  if (!data) return "";
  const { resumen_general: r, top_items, tendencias, oportunidades } = data;

  const meses = tendencias.map((t) => `  - ${t.mes}: ${t.ganancias_eur} EUR, ${t.descargas} descargas, ${t.assets_nuevos} nuevos`).join("\n");
  const tops = top_items.slice(0, 5).map((t, i) => `  ${i + 1}. "${t.nombre}" (${t.tipo}): ${t.ganancias_eur} EUR, ${t.descargas} descargas`).join("\n");
  const ops = oportunidades.map((o) => `  - [${o.tipo}] ${o.descripcion}`).join("\n");

  return `Eres un experto en monetizacion de contenido creativo en plataformas como Freepik.

Aqui tienes mis datos de rendimiento como contribuidor:

== RESUMEN ==
- Assets unicos: ${r.total_assets_unicos}
- Meses analizados: ${r.meses_analizados} (${r.rango_temporal})
- Ganancias totales: ${r.ganancias_totales_eur} EUR
- Descargas totales: ${r.descargas_totales}
- Ingreso promedio por asset: ${r.ingreso_promedio_por_asset} EUR
- Assets sin ninguna descarga: ${r.assets_sin_descargas}

== TOP 5 ASSETS ==
${tops}

== TENDENCIA MENSUAL ==
${meses}

== OPORTUNIDADES DETECTADAS ==
${ops}

Por favor:
1. Analiza mis datos y dame un diagnostico claro de mi situacion actual.
2. Identifica patrones en mis mejores y peores contenidos.
3. Dame al menos 5 recomendaciones concretas y accionables para aumentar mis ingresos.
4. Sugiere una estrategia de contenido para los proximos 3 meses basada en estos datos.
5. Identifica cualquier riesgo o tendencia negativa que deba atender con urgencia.

Sé directo, especifico y basa todas tus recomendaciones en los datos proporcionados.`;
}
