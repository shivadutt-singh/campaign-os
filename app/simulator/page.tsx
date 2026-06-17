"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  ArrowRight, 
  SlidersHorizontal, 
  Activity, 
  Terminal, 
  Loader2,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

// --- Premium Custom Tooltip for Recharts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111111]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-md rounded-lg">
        <p className="text-zinc-400 text-xs mb-3 font-mono border-b border-white/10 pb-2">
          {label}
        </p>
        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-zinc-300">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-white">
                ${Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function SimulatorPage() {
  const [budgets, setBudgets] = useState({
    "Google Ads": 5000,
    "Facebook Ads": 3000,
    "LinkedIn Ads": 2000,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simRun, setSimRun] = useState(false);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgets),
      });

      if (!response.ok) throw new Error("Predictive engine failed to compute matrix.");

      const jsonResult = await response.ok ? await response.json() : [];
      setData(jsonResult);
      setSimRun(true);
    } catch (err: any) {
      setError(err.message || "Execution error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (channel: string, value: number) => {
    setBudgets((prev) => ({ ...prev, [channel]: value }));
  };

  const uniqueInsights = Array.from(new Set(data.map((row: any) => row.AI_Insight))).filter(Boolean);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#3bf4ff] selection:text-black flex flex-col">
      
      {/* Background Grid */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* --- PREMIUM NAVBAR --- */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-[#7b5ff0] flex items-center justify-center font-bold text-black group-hover:scale-105 transition-transform">
                C
              </div>
              <span className="font-semibold text-zinc-100 tracking-tight group-hover:text-white transition-colors">
                CampaignOS
              </span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              Workspace <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              SYSTEM_ONLINE
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5df5a5] to-[#3bf4ff] p-[1px] cursor-pointer">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold">
                US
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN DASHBOARD AREA --- */}
      <main className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Predictive Simulator</h1>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Adjust your channel budgets below. Our deterministic AI will forecast expected revenue boundaries instantly.
            </p>
          </div>
          {simRun && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Matrix Updated
            </motion.div>
          )}
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: CONTROLS (Spans 4 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col gap-8 sticky top-24"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-[#5df5a5]/10 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-[#5df5a5]" />
              </div>
              <h2 className="text-lg font-semibold">Budget Allocation</h2>
            </div>

            <div className="flex flex-col gap-6">
              {Object.entries(budgets).map(([channel, value]) => (
                <div key={channel} className="flex flex-col gap-3 group">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-300 group-hover:text-white transition-colors">
                      {channel}
                    </span>
                    <span className="font-mono text-[#3bf4ff] bg-[#3bf4ff]/10 px-2 py-0.5 rounded border border-[#3bf4ff]/20">
                      ${value.toLocaleString()}
                    </span>
                  </div>
                  {/* Premium Slider Customization */}
                  <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#5df5a5] to-[#3bf4ff]" 
                      style={{ width: `${(value / 20000) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={value}
                      onChange={(e) => handleSliderChange(channel, Number(e.target.value))}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-white text-black font-semibold tracking-wide text-sm rounded-lg hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Computing...</>
              ) : (
                <><Rocket className="w-4 h-4" /> Generate Projection</>
              )}
            </button>
          </motion.div>

          {/* RIGHT PANEL: VISUALIZATION & LOGS (Spans 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full overflow-hidden">
            
            {/* Chart Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl min-h-[420px] flex flex-col relative group"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ffe975]/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#ffe975]" />
                  </div>
                  <h2 className="text-lg font-semibold">Revenue Matrix</h2>
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-4 bg-[#111111] p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3bf4ff]" />
                    <p className="text-xs font-mono tracking-widest uppercase text-zinc-400">
                      Processing Data...
                    </p>
                  </div>
                </div>
              )}

              {data.length === 0 && !loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-lg bg-white/[0.02]">
                  <Activity className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 max-w-sm">
                    Workspace is empty. Adjust your budgets and run the simulation to visualize projected bounds.
                  </p>
                </div>
              ) : (
                <div className="w-full h-[320px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="Date" stroke="#52525b" tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#52525b" tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `$${val}`} />
                      
                      {/* Premium Custom Tooltip */}
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      
                      <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ paddingBottom: "20px" }}/>
                      
                      <Area type="monotone" dataKey="Worst_Case" name="Worst Case" fill="url(#colorWorst)" stroke="none" />
                      <Area type="monotone" dataKey="Best_Case" name="Best Case" fill="url(#colorBest)" stroke="none" />
                      <Line type="monotone" dataKey="Expected_Revenue" name="Expected" stroke="#3bf4ff" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#3bf4ff", stroke: "#000", strokeWidth: 2 }} />
                      
                      {/* SVG Gradients for Area fills */}
                      <defs>
                        <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7b5ff0" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7b5ff0" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5df5a5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#5df5a5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}
            </motion.div>

            {/* Terminal / Insights Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-[#f5d5ff]/10 rounded-lg">
                  <Terminal className="w-5 h-5 text-[#f5d5ff]" />
                </div>
                <h2 className="text-lg font-semibold">Causal Insights Log</h2>
              </div>

              <div className="min-h-[100px] bg-black/60 rounded-lg border border-white/5 p-5 font-mono text-xs text-zinc-300 leading-relaxed overflow-y-auto">
                {uniqueInsights.length === 0 ? (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <span className="animate-pulse">_</span> Awaiting execution parameters...
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {uniqueInsights.map((insight: any, index) => (
                      <div key={index} className="flex gap-3 items-start group">
                        <span className="text-emerald-500 select-none mt-0.5">❯</span>
                        <span className="text-zinc-300 group-hover:text-white transition-colors">{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* --- PREMIUM FOOTER --- */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-[#0A0A0A] mt-auto py-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
              C
            </div>
            <span className="text-zinc-500 text-sm font-medium">© 2026 CampaignOS Inc.</span>
          </div>
          <div className="text-xs font-mono text-zinc-600 flex gap-6 items-center">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Documentation</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">API Status</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <span className="text-emerald-500/70">v2.0.4-stable</span>
          </div>
        </div>
      </footer>

    </div>
  );
}