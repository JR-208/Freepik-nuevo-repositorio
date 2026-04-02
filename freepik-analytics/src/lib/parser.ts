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
  // Try YYYY-MM pattern
  const m1 = filename.match(/(\d{4})[_\-](\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}`;
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
  const map = new Map<string, { earnings: number; downloads: number; newAssets: number }>();

  for (const asset of assets) {
    const existing = map.get(asset.month) || { earnings: 0, downloads: 0, newAssets: 0 };
    map.set(asset.month, {
      earnings: existing.earnings + asset.earnings,
      downloads: existing.downloads + asset.downloads,
      newAssets: existing.newAssets + 1,
    });
  }

  return Array.from(map.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
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
      title: "Pareto Principle",
      description: `Your top 20% of assets (${top20Count} files) generate ${pct}% of total revenue.`,
      value: `${pct}%`,
    });
  }

  // Zero downloads
  const zeroDL = assets.filter((a) => a.downloads === 0).length;
  if (zeroDL > 0) {
    insights.push({
      id: "zero_downloads",
      type: zeroDL > total * 0.3 ? ("warning" as const) : ("neutral" as const),
      title: "Assets with Zero Downloads",
      description: `${zeroDL} asset${zeroDL > 1 ? "s have" : " has"} never been downloaded. Consider refreshing titles or descriptions.`,
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
      title: "Best Performing Asset Type",
      description: `"${best.type}" is your top category with $${best.earnings.toFixed(2)} in total earnings across ${best.count} assets.`,
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
      title: "Highest Revenue per Download",
      description: `"${best.type}" earns $${best.earningsPerDownload.toFixed(4)} per download — your most efficient category.`,
      value: `$${best.earningsPerDownload.toFixed(4)}`,
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
        title: `Keyword "${topKw.keyword}" Outperforms`,
        description: `Assets containing "${topKw.keyword}" earn ${pct}% more than your average asset.`,
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
          title: "Monthly Earnings Trend",
          description: `Your last recorded month showed ${growth > 0 ? "+" : ""}${growth.toFixed(1)}% earnings change vs the previous month.`,
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
        title: "Reallocation Opportunity",
        description: `Consider creating more "${byType[0].type}" assets and fewer "${underperforming[0].type}" — the revenue differential is significant.`,
        value: "Tip",
      });
    }
  }

  return insights;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
