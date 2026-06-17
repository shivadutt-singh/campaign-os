"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export default function ProbabilisticChart({
  isLoading,
  budget,
  duration,
  growth,
}: {
  isLoading: boolean;
  budget: number;
  duration: number;
  growth: number;
}) {
  const chartData = useMemo(() => {
    const data = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Simple baseline calculation based on budget and growth
    let currentExpected = budget * 0.2; // initial expected revenue

    for (let i = 0; i < duration; i++) {
      const monthLabel = months[i % 12];

      // Calculate growth compound
      const monthlyGrowthRate = growth / 100 / 12;
      currentExpected = currentExpected * (1 + monthlyGrowthRate);

      data.push({
        month: `Month ${i + 1} (${monthLabel})`,
        best: Math.round(currentExpected * 1.25),
        expected: Math.round(currentExpected),
        worst: Math.round(currentExpected * 0.75),
      });
    }

    return data;
  }, [budget, duration, growth]);

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
        <div className="h-8 w-56 bg-zinc-700 rounded animate-pulse mb-6"></div>

        <div className="h-[300px] w-full bg-zinc-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">
        Revenue Forecast
      </h2>

      <div className="w-full h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey="month" />
             <YAxis />
             <Tooltip
              formatter={(value, name) => {
              if (name === "") return null;
              return [value, name];
              }}
              />
             <Legend />

             <Area
              type="monotone"
              dataKey="best"
              name="Risk Range"
              stroke="none"
              fill="#333333"
              fillOpacity={0.25}
              legendType="none"
              />

             <Line
                type="monotone"
                dataKey="best"
                stroke="#22C55E"
                strokeWidth={3}
             />

             <Line
                type="monotone"
                dataKey="expected"
                stroke="#3B82F6"
                strokeWidth={3}
             />

             <Line
                type="monotone"
                dataKey="worst"
                stroke="#EF4444"
                strokeWidth={3}
             />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}