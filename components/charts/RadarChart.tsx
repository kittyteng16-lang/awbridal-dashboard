"use client";

import {
  RadarChart as ReRadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

interface RadarChartProps {
  data: { subject: string; score: number }[];
  height?: number;
}

export function RadarChart({ data, height = 240 }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReRadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          formatter={(v: number) => [`${v}分`, "得分"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
        />
        <Radar
          name="得分"
          dataKey="score"
          stroke="#6366F1"
          fill="#6366F1"
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ r: 3, fill: "#6366F1" }}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
