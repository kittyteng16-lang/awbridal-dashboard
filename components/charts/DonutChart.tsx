"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#6366F1","#10B981","#F59E0B","#3B82F6","#EC4899","#8B5CF6","#14B8A6"];

interface DonutChartProps {
  data: { name: string; value: number }[];
  height?: number;
  innerRadius?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload[0]?.payload?.total;
  return (
    <div className="rounded-lg border bg-card shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

export function DonutChart({ data, height = 240, innerRadius = 60 }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 36}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
