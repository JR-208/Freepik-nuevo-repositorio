"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from "recharts";

const CHART_COLORS = {
  accent: "#63b3ed",
  success: "#48c78e",
  warning: "#ffb400",
  danger: "#fc5a5a",
  purple: "#b794f4",
  pink: "#f687b3",
};

const tooltipStyle = {
  backgroundColor: "rgb(16,16,20)",
  border: "1px solid rgb(40,40,52)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "rgb(240,240,248)",
};

interface EarningsChartProps {
  data: { month: string; earnings: number }[];
}

export function EarningsLineChart({ data }: EarningsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#63b3ed" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#63b3ed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,40,52,0.8)" />
        <XAxis dataKey="month" tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`€${v.toFixed(2)}`, "Ganancias"]} />
        <Area type="monotone" dataKey="earnings" stroke="#63b3ed" strokeWidth={2} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 4, fill: "#63b3ed" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DownloadsChartProps {
  data: { month: string; downloads: number }[];
}

export function DownloadsLineChart({ data }: DownloadsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="downloadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#48c78e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#48c78e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,40,52,0.8)" />
        <XAxis dataKey="month" tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString("es-ES"), "Descargas"]} />
        <Area type="monotone" dataKey="downloads" stroke="#48c78e" strokeWidth={2} fill="url(#downloadsGrad)" dot={false} activeDot={{ r: 4, fill: "#48c78e" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface TypeBarChartProps {
  data: { type: string; value: number }[];
  color?: "accent" | "success";
  formatValue?: (v: number) => string;
}

export function TypeBarChart({ data, color = "accent", formatValue }: TypeBarChartProps) {
  const stroke = color === "accent" ? CHART_COLORS.accent : CHART_COLORS.success;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,40,52,0.8)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={formatValue || ((v) => v.toString())} />
        <YAxis type="category" dataKey="type" tick={{ fill: "#a0a0b4", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatValue ? formatValue(v) : v, ""]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={stroke} fillOpacity={1 - i * 0.07} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface GrowthChartProps {
  data: { month: string; earnings: number; downloads: number; newAssets: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,40,52,0.8)" />
        <XAxis dataKey="month" tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5a5a6e", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="earnings" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} name="Ganancias (€)" />
        <Line type="monotone" dataKey="downloads" stroke={CHART_COLORS.success} strokeWidth={2} dot={false} name="Descargas" />
        <Line type="monotone" dataKey="newAssets" stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} name="Nuevos Assets" />
      </LineChart>
    </ResponsiveContainer>
  );
}
