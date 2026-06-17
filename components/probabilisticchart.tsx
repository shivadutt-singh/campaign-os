"use client";

import { useEffect, useState } from "react";
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

const data = [
  { month: "Jan", best: 15000, expected: 12000, worst: 9000 },
  { month: "Feb", best: 22000, expected: 18000, worst: 14000 },
  { month: "Mar", best: 29000, expected: 24000, worst: 19000 },
  { month: "Apr", best: 36000, expected: 30000, worst: 25000 },
  { month: "May", best: 45000, expected: 38000, worst: 32000 },
  { month: "Jun", best: 56000, expected: 47000, worst: 40000 },
];

export default function ProbabilisticChart({
  isLoading,
}: {
  isLoading: boolean;
}) {
  
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
          <ComposedChart data={data}>
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