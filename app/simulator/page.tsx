"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  SlidersHorizontal, 
  Activity, 
  Terminal, 
  Loader2,
  CheckCircle2,
  Save,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Curve } from "recharts";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  AreaChart,
} from "recharts";

// --- Premium Custom Tooltip for Recharts ---
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {

  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111111]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-md rounded-lg">
        <p className="text-zinc-400 text-xs mb-3 font-mono border-b border-white/10 pb-2">
          {label}
        </p>

        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-zinc-300">
                  {entry.name}
                </span>
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

interface ChannelMetrics {
  predicted_revenue: number;
  impressions: number;
  expected_clicks: number;
  ctr: number;
  conversion_rate: number;
  roas: number;
  saturation_warning: boolean;
}

export default function SimulatorPage() {

  const [budgets, setBudgets] = useState({
    "Google Ads": 5000,
    "Facebook Ads": 3000,
    "LinkedIn Ads": 2000,
    "TikTok Ads": 1000,
  });

  const formatCurrency = (num: number) =>
    num.toLocaleString("en-US");

    const MAX_BUDGET = 100000;

   const totalBudget = Object.values(budgets).reduce(
    (sum, value) => sum + value,
      0
    );

    const remainingBudget = MAX_BUDGET - totalBudget;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simRun, setSimRun] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"manual" | "optimize">("manual");
  const [targetRevenueInput, setTargetRevenueInput] = useState<number>(100000);

  useEffect(() => {
    setMounted(true);
    
    // Restore campaign from URL params if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const campId = params.get('id');
      if (campId) {
        const raw = localStorage.getItem("campaignos_sessions");
        let restored = false;
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const found = list.find((c: any) => c.id === campId);
              if (found) {
                setBudgets(JSON.parse(found.budgetPayload));
                restored = true;
              }
            }
          } catch (e) {
            console.error("Failed to restore from local campaignos_sessions", e);
          }
        }

        if (!restored) {
          const mockCampaigns = [
            { id: "1", budgets: { "Google Ads": 10000, "Facebook Ads": 8000, "LinkedIn Ads": 6500 } },
            { id: "2", budgets: { "Google Ads": 5000, "Facebook Ads": 3000, "LinkedIn Ads": 2000, "TikTok Ads": 1000 } },
            { id: "3", budgets: { "Google Ads": 15000, "Facebook Ads": 5000 } }
          ];
          const found = mockCampaigns.find(c => c.id === campId);
          if (found) {
            setBudgets(prev => ({
              ...prev,
              ...found.budgets
            }));
          }
        }
      }
    }
  }, []);

  const lastBudgets = useRef(JSON.stringify(budgets));

  const handleSaveSimulation = async () => {
    setSaving(true);
    try {
      let existing = [];
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem("campaignos_sessions");
        if (raw) {
          try {
            existing = JSON.parse(raw);
            if (!Array.isArray(existing)) existing = [];
          } catch {
            existing = [];
          }
        }
      }

      const newSession = {
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        budgetPayload: JSON.stringify(budgets),
        projectedRevenue: Number(projectedRevenue),
        roi: Number(roi)
      };

      existing.unshift(newSession);

      if (typeof window !== 'undefined') {
        localStorage.setItem("campaignos_sessions", JSON.stringify(existing));
      }

      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
      alert("Campaign saved successfully to local workspace!");
    } catch (err) {
      alert("Error saving campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = async () => {
    if (
      JSON.stringify(budgets) === lastBudgets.current &&
      data.length > 0
    ) {
      return;
    }

    lastBudgets.current = JSON.stringify(budgets);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgets),
      });

      if (!response.ok) throw new Error("Predictive engine failed to compute matrix.");

      const jsonResult = await response.json();

console.log("API RESPONSE:", jsonResult);
const cleanedData = jsonResult.map((row: any) => ({
  ...row,
  Expected_Revenue: Number(row.Expected_Revenue),
  Best_Case: Number(row.Best_Case),
  Worst_Case: Number(row.Worst_Case),
}));

console.log("CLEANED:", cleanedData);

const sortedData = cleanedData
  .sort(
    (a: any, b: any) =>
      new Date(a.Date).getTime() -
      new Date(b.Date).getTime()
  )
  .slice(0, 10);

setData(sortedData);

console.table(
  cleanedData.map((row: any) => ({
    Date: row.Date,
    Channel: row.Channel,
  }))
);
console.table(cleanedData);

console.log("Rows:", jsonResult.length);
console.table(jsonResult);


setSimRun(true);
    }
    catch (err: any) {
      setError(err.message || "Execution error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRevenue: targetRevenueInput }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Optimizer service failed.");
      }

      const result = await response.json();
      
      const newBudgets = {
        "Google Ads": Math.round(result.allocations.google_ads || 0),
        "Facebook Ads": Math.round(result.allocations.meta_ads || 0),
        "LinkedIn Ads": Math.round(result.allocations.bing_ads || 0),
        "TikTok Ads": 0,
      };
      
      setBudgets(newBudgets);

      const simResponse = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBudgets),
      });

      if (!simResponse.ok) throw new Error("Simulation failed to calculate projections for optimized allocation.");

      const jsonResult = await simResponse.json();
      const sortedData = jsonResult
        .map((row: any) => ({
          ...row,
          Expected_Revenue: Number(row.Expected_Revenue),
          Best_Case: Number(row.Best_Case),
          Worst_Case: Number(row.Worst_Case),
        }))
        .sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
        .slice(0, 10);

      setData(sortedData);
      setSimRun(true);
    } catch (err: any) {
      setError(err.message || "Optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (channel: string, value: number) => {
    const otherChannelsTotal = Object.entries(budgets)
      .filter(([key]) => key !== channel)
      .reduce((sum, [, val]) => sum + val, 0);

    if (otherChannelsTotal + value <= MAX_BUDGET) {
      setBudgets((prev) => ({
        ...prev,
        [channel]: value,
      }));
    }
  };
  const projectedRevenue = data.reduce(
    (sum, row) => sum + Number(row.Expected_Revenue || 0),
    0
  );

  const rawROI =
  totalBudget > 0
    ? ((projectedRevenue - totalBudget) / totalBudget) * 100
    : 0;

const roi = Math.max(-100, Math.min(100, Math.round(rawROI)));

      const revenueLift = Math.max(
        0,
        Math.round(Number(roi) * 0.15)
      );       

    const confidence =
        data.length > 0
          ? Math.min(
              95,
              Math.max(
                50,
                Math.round(70 + roi / 5)
              )
            )
          : 0;

          const roiColor =
            roi < 0
              ? "#ef4444"
              : roi < 30
              ? "#facc15"
              : "#22c55e";

      const uniqueInsights = Array.from(new Set(data.map((row: any) => row.AI_Insight))).filter(Boolean);

      const topChannel = Object.entries(budgets).sort((a, b) => b[1] - a[1])[0]?.[0] || "Google Ads";

      const channelParams: any = {
        "Google Ads": { roi: 4.7616, cpc: 0.5641,   ctr: 0.0130, cvr: 0.0306, threshold: 9711.03 },
        "Facebook Ads": { roi: 8.4362, cpc: 0.3632,   ctr: 0.0325, cvr: 0.0450, threshold: 1579.47 },
        "LinkedIn Ads": { roi: 1.50, cpc: 0.50,   ctr: 0.0200, cvr: 0.0300, threshold: 500.00 },
        "TikTok Ads":   { roi: 1.50, cpc: 0.50,   ctr: 0.0200, cvr: 0.0300, threshold: 500.00 }
      };

      const channelMetrics: Record<string, ChannelMetrics> = Object.entries(budgets).reduce((acc: Record<string, ChannelMetrics>, [channel, val]) => {
        const budget = Number(val);
        const p = channelParams[channel] || { roi: 1.5, cpc: 0.5, ctr: 0.02, cvr: 0.03, threshold: 500.0 };
        const thresholdTotal = p.threshold * 10;
        const saturationWarning = budget > thresholdTotal;
        
        let predictedRevenue = 0;
        if (!saturationWarning) {
          predictedRevenue = budget * p.roi;
        } else {
          predictedRevenue = (thresholdTotal * p.roi) + (thresholdTotal * p.roi * Math.log(1.0 + (budget - thresholdTotal) / thresholdTotal));
        }
        
        const clicks = p.cpc > 0 ? budget / p.cpc : 0;
        const impressions = p.ctr > 0 ? clicks / p.ctr : 0;
        const roas = budget > 0 ? predictedRevenue / budget : 0;
        
        acc[channel] = {
          predicted_revenue: predictedRevenue,
          impressions: Math.round(impressions),
          expected_clicks: Math.round(clicks),
          ctr: p.ctr,
          conversion_rate: p.cvr,
          roas: roas,
          saturation_warning: saturationWarning
        };
        return acc;
      }, {} as Record<string, ChannelMetrics>);

      const topPerformingChannel = Object.entries(channelMetrics)
        .filter(([_, metrics]) => !metrics.saturation_warning)
        .sort((a, b) => b[1].roas - a[1].roas)[0];

      const recommendedChannelName = topPerformingChannel 
        ? topPerformingChannel[0] 
        : Object.entries(channelMetrics).sort((a, b) => b[1].roas - a[1].roas)[0]?.[0] || "Google Ads";
        
      const recommendedChannelROAS = topPerformingChannel 
        ? topPerformingChannel[1].roas 
        : Object.entries(channelMetrics).sort((a, b) => b[1].roas - a[1].roas)[0]?.[1]?.roas || 0;

      const saturatedChannels = Object.entries(channelMetrics)
        .filter(([_, metrics]) => metrics.saturation_warning)
        .map(([name]) => name);

      const hasSaturation = saturatedChannels.length > 0;

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
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <Link href="/simulator" className="text-white border-b border-[#3bf4ff] pb-1 transition-all">
                Simulator
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                History
              </Link>
            </div>
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
            <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-xl px-4 py-3">
              <p className="text-emerald-400 font-semibold">
                ✓ Matrix Updated
              </p>
              <p className="text-xs text-zinc-500">
                Just now
              </p>
        </div>
      )}
    </div>

        {/* Bento Grid Layout */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-8">
          
          {/* LEFT PANEL: CONTROLS (Spans 4 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 h-fit flex flex-col gap-8 h-fit">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-[#5df5a5]/10 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-[#5df5a5]" />
              </div>

              <h2 className="text-lg font-semibold">
                Budget Allocation
              </h2>
            </div>

            {/* Pill-shaped animated toggle */}
            <div className="relative flex items-center p-1 bg-black/40 border border-white/5 rounded-full w-full">
              <div 
                className="absolute top-1 bottom-1 rounded-full bg-[#3bf4ff]/10 border border-[#3bf4ff]/20 transition-all duration-300 ease-out"
                style={{
                  left: mode === "manual" ? "4px" : "50%",
                  width: "calc(50% - 4px)"
                }}
              />
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`relative z-10 w-1/2 text-center text-xs font-mono py-1.5 rounded-full transition-colors duration-200 ${
                  mode === "manual" ? "text-[#3bf4ff] font-semibold" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setMode("optimize")}
                className={`relative z-10 w-1/2 text-center text-xs font-mono py-1.5 rounded-full transition-colors duration-200 ${
                  mode === "optimize" ? "text-[#3bf4ff] font-semibold" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Goal-Seek
              </button>
            </div>

            {mode === "optimize" ? (
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
                  Target Revenue ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={targetRevenueInput}
                    onChange={(e) => setTargetRevenueInput(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-[#3bf4ff] transition-colors"
                  />
                  <div className="absolute right-3 top-3 text-zinc-500 text-xs font-mono">USD</div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Enter your target campaign revenue. The Reverse Goal-Seek Optimizer will dynamically calculate the optimal budget allocations.
                </p>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex flex-col items-center">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Total
                  </p>
                  <p className="text-lg font-bold text-white">
                     ${formatCurrency(MAX_BUDGET)}
                  </p>
                  </div>
               </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Used
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                     ${formatCurrency(totalBudget)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Left
                  </p>
                  <p className="text-lg font-bold text-cyan-400">
                    ${formatCurrency(remainingBudget)}
                  </p>
              </div>
           </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>Budget Usage</span>
                  <span>{Math.round((totalBudget / MAX_BUDGET) * 100)}%</span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5df5a5] via-[#3bf4ff] to-[#7b5ff0]"
                    style={{
                      width: `${(totalBudget / MAX_BUDGET) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

            <div className={`flex flex-col gap-6 transition-all duration-300 ${
              mode === "optimize" ? "opacity-40 pointer-events-none" : ""
            }`}>
              {Object.entries(budgets).map(([channel, value]) => (
                <div key={channel} className="flex flex-col gap-3 group">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-300 group-hover:text-white transition-colors">
                      {channel}
                    </span>
                    <span className="font-mono text-[#3bf4ff] bg-[#3bf4ff]/10 px-2 py-0.5 rounded border border-[#3bf4ff]/20">
                      ${formatCurrency(value)}
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

            {mode === "manual" ? (
              <button
                onClick={handleRunSimulation}
                disabled={loading}
                className="w-full mt-2 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold tracking-wide text-sm rounded-lg hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running AI Simulation...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Generate Projection
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleOptimizeBudgets}
                disabled={loading}
                className="w-full mt-2 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold tracking-wide text-sm rounded-lg hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Optimizing Budgets...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Run Goal-Seek
                  </>
                )}
              </button>
            )}

                 {/* Save Forecast Button - Yahan add karo */}
                 {simRun && (
                   <button
                     onClick={handleSaveSimulation}
                     disabled={saving || loading}
                     className="w-full mt-3 py-5 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-white/10"
                   >
                     {saving ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : savedStatus ? (
                       <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                     ) : (
                       <Save className="h-4 w-4" />
                     )}
                     {savedStatus ? "Saved!" : "Save Forecast"}
                   </button>
                 )}

                <div className="grid grid-cols-2 gap-3 mt-3">

                  <button
                    disabled={data.length === 0}
                    onClick={() => {

                      const headers = Object.keys(data[0]).join(",");

                      const rows = data
                        .map((row) =>
                          Object.values(row)
                            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                            .join(",")
                        )
                        .join("\n");

                      const csv = `${headers}\n${rows}`;

                      const blob = new Blob([csv], {
                        type: "text/csv",
                      });

                      const url = URL.createObjectURL(blob);

                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "forecast.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="py-3 bg-cyan-600 rounded-lg font-semibold hover:bg-cyan-700 disabled:bg-zinc-800"
                  >
                    Download CSV
                  </button>

                  <button
                    onClick={() => {
                      const defaultBudgets = {
                        "Google Ads": 5000,
                        "Facebook Ads": 3000,
                        "LinkedIn Ads": 2000,
                        "TikTok Ads": 1000,
                      };

                      setBudgets(defaultBudgets);
                      setData([]);
                      setSimRun(false);
                      setError(null);

                      lastBudgets.current = "";
                    }}
                    className="py-3 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600"
                  >
                    Reset Budget
                  </button>

                </div>
                <button
                    onClick={() => {
                      const text =
                        uniqueInsights.join("\n\n");

                      const blob = new Blob(
                        [text],
                        { type: "text/plain" }
                      );

                      const url =
                        URL.createObjectURL(blob);

                      const a =
                        document.createElement("a");

                      a.href = url;
                      a.download = "AI_Insights.txt";
                      a.click();
                    }}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-xl
                      border
                      border-cyan-500/20
                      bg-cyan-500/10
                      px-5
                      py-3
                      text-cyan-400
                      font-semibold
                      transition-all
                      hover:bg-cyan-500/20
                      hover:border-cyan-400/40
                      hover:shadow-[0_0_25px_rgba(34,211,238,0.25)]
                    "
                  >
                    ✦ Export AI Insights
                  </button>

          </motion.div>

          {/* RIGHT PANEL: VISUALIZATION & LOGS (Spans 8 cols) */}
          <div className="flex flex-col gap-6 w-full min-w-0">
            
            {/* Chart Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="
                bg-zinc-900
                rounded-2xl
                border
                border-zinc-800
                p-8 flex flex-col relative group min-w-0"
              >
                
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ffe975]/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#ffe975]" />
                  </div>
                  <h2 className="text-lg font-semibold">Revenue Matrix</h2>
               </div>
             </div>

                   {/* Revenue Matrix */}
                  {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

                        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-5">

                        <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Projected Revenue
                        </p>

                        <div className="mt-3 flex justify-between items-end">

                        <div>

                        <p className="text-3xl font-bold text-cyan-400">
                        ${formatCurrency(Math.round(projectedRevenue))}
                        </p>

                        </div>

                        <div className="w-[90px] h-[45px]">

                        <ResponsiveContainer>

                        <LineChart data={data.slice(-7)}>

                        <defs>

                        <linearGradient id="revGradient">

                        <stop offset="0%" stopColor="#00E5FF"/>

                        <stop offset="100%" stopColor="#7B5FF0"/>

                        </linearGradient>

                        </defs>

                        <Line
                          type="natural"
                          dataKey="Expected_Revenue"
                          filter="url(#lineGlow)"
                          stroke="#60a5fa"
                          strokeWidth={4}
                          dot={false}
                          activeDot={{
                            r: 5,
                            strokeWidth: 0,
                            fill: "#60a5fa",
                          }}
                          isAnimationActive
                          animationDuration={1800}
                          animationEasing="ease-out"
                        />

                        </LineChart>

                        </ResponsiveContainer>

                        </div>

                        </div>

                        </div>

                        {/* ROI */}

                        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-5">

                        <p className="text-xs uppercase tracking-wider text-zinc-500">
                        ROI
                        </p>

                        <div className="mt-3 flex justify-between items-end">

                        <div>

                        <p
                        className={`text-3xl font-bold ${
                        roi < 0
                        ? "text-red-400"
                        : roi > 50
                        ? "text-emerald-400"
                        : "text-yellow-400"
                        }`}
                        >
                        {roi}%
                        </p>

                        </div>

                        <div className="w-[90px] h-[45px]">

                        <ResponsiveContainer>

                        <LineChart data={data.slice(-7)}>

                        <Line
                        type="natural"
                        dataKey="Expected_Revenue"
                        stroke={roiColor}
                        strokeWidth={3}
                        dot={false}
                        />

                        </LineChart>

                        </ResponsiveContainer>

                        </div>

                        </div>

                        </div>

                        {/* Confidence */}

                        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-5">

                        <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Confidence
                        </p>

                        <div className="mt-3 flex justify-between items-end">

                        <div>

                        <p className="text-3xl font-bold text-purple-400">
                        {confidence}%
                        </p>

                        </div>

                        <div className="w-[90px] h-[45px]">

                        <ResponsiveContainer>

                        <LineChart data={data.slice(-7)}>

                        <Line
                        type="natural"
                        dataKey="Best_Case"
                        stroke="#A855F7"
                        strokeWidth={3}
                        dot={false}
                        />

                        </LineChart>

                        </ResponsiveContainer>

                        </div>

                        </div>

                        </div>

                        </div>
                  )}

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
                    No simulation data available. Allocate budget and launch the predictive engine.
                  </p>
                </div>
              ) : (
                <div className="w-full h-[420px] min-w-0 text-xs font-mono">
                  <ResponsiveContainer width="100%" height={420}>
                    <ComposedChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 25 }}>
                      <style>
                        {`
                          .recharts-curve{
                          stroke-linecap:round;
                          stroke-linejoin:round;
                          }
                        `}
                      </style>

                      <CartesianGrid
                        stroke="rgba(255,255,255,0.03)"
                        strokeDasharray="2 6"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="Date"
                        interval={0}              
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        tickMargin={18}
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />

                      <YAxis
                        domain={[
                          (dataMin:number) => dataMin - 500,
                          (dataMax:number) => dataMax + 500,
                        ]}
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 11 }}                       
                        dx={-10}
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(1)}k`
                        }
                      />
                      
                      {/* Premium Custom Tooltip */}
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 2, strokeDasharray: '4 6' }} />
                      
                      <Legend verticalAlign="top" height={60} iconType="circle" wrapperStyle={{ paddingBottom: "40px" }}/>
                      
                      <Area
                        type="natural"
                        dataKey="Worst_Case"
                        stroke="#7C3AED"
                        fill="url(#worstGradient)"
                        strokeWidth={2}
                        fillOpacity={0.08}
                        dot={false}
                        activeDot={{
                        r:4,
                        fill:"#7C3AED"
                        }}
                        isAnimationActive
                        animationDuration={1800}
                        animationEasing="ease-out"
                      />

                      <Area
                        type="natural"
                        isAnimationActive
                        animationDuration={1800}
                        animationEasing="ease-out"
                        dataKey="Best_Case"
                        stroke="#10B981"
                        fill="url(#bestGradient)"
                        strokeWidth={2}
                        fillOpacity={0.08}
                        dot={false}
                        activeDot={{
                        r:4,
                        fill:"#10B981"
                        }}
                      />

                      <Line
                        type="natural"
                        dataKey="Expected_Revenue"
                        stroke="#22D3EE"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{
                        r:5,
                        stroke:"#22D3EE",
                        strokeWidth:3,
                        fill:"#0A0A0A"
                        }}
                        isAnimationActive
                        animationDuration={1800}
                      />
                                                                    

                      {/* SVG Gradients for Area fills */}
                            <defs>

                            <linearGradient
                            id="bestGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                            >

                            <stop
                            offset="0%"
                            stopColor="#10B981"
                            stopOpacity={0.35}
                            />

                            <stop
                            offset="100%"
                            stopColor="#10B981"
                            stopOpacity={0}
                            />

                            </linearGradient>

                            <linearGradient
                            id="worstGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                            >

                            <stop
                            offset="0%"
                            stopColor="#7C3AED"
                            stopOpacity={0.35}
                            />

                            <stop
                            offset="100%"
                            stopColor="#7C3AED"
                            stopOpacity={0}
                            />

                            </linearGradient>

                            <filter id="cyanGlow">

                            <feGaussianBlur stdDeviation="5"/>

                            <feMerge>

                            <feMergeNode/>

                            <feMergeNode in="SourceGraphic"/>

                            </feMerge>

                            </filter>
                            <filter id="lineGlow" height="300%">
                              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                              <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                          </filter>

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

              <div className="w-full min-h-[160px] bg-black/60 rounded-lg border border-white/5 p-5 font-mono text-xs text-zinc-300">
              {mounted && data.length > 0 && (
                <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <p className="text-cyan-400 font-semibold">
                    ✦ AI Recommendation
                  </p>

                  <p className="mt-2 text-zinc-300">
                    Increase budget allocation toward
                    <span className="text-cyan-400 font-semibold">
                      {" "}
                      {recommendedChannelName}
                    </span>
                  </p>

                  <p className="mt-2 text-emerald-400 font-semibold">
                    ↑ High Efficiency: {recommendedChannelROAS.toFixed(2)}x Avg ROAS
                  </p>
                </div>
              )}
                {!mounted || data.length === 0 ? (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <span className="animate-pulse">_</span> Awaiting execution parameters...
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 items-start group">
                      <span className="text-emerald-500 select-none mt-0.5">❯</span>
                      <span className="text-zinc-300 group-hover:text-white transition-colors">
                        {hasSaturation 
                          ? `AI Insight: Diminishing returns detected on ${saturatedChannels.join(" & ")}. Overflow budget automatically routed to higher-efficiency channels.`
                          : `AI Insight: Optimal spend distribution achieved across all active channels within efficiency bounds.`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Detailed Channel Projections Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-[#3bf4ff]/10 rounded-lg">
              <Rocket className="w-5 h-5 text-[#3bf4ff]" />
            </div>
            <h2 className="text-lg font-semibold">Detailed Channel Projections</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
               <thead>
                 <tr className="border-b border-white/5">
                   <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Channel</th>
                   <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Impressions</th>
                   <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Expected Clicks</th>
                   <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">ROAS</th>
                   <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Expected Revenue</th>
                 </tr>
               </thead>
               <tbody>
                                {mounted && Object.entries(channelMetrics).map(([channel, metrics]: [string, ChannelMetrics]) => (
                    <tr
                      key={channel}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-all duration-150 ${
                        metrics.saturation_warning 
                          ? "border-l-2 border-red-500/50 bg-red-500/5" 
                          : ""
                      }`}
                    >
                      <td className="py-4.5 px-4 text-sm text-zinc-200 flex items-center gap-2">
                        {metrics.saturation_warning && (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="font-semibold">{channel}</span>
                        {metrics.saturation_warning && (
                          <span className="text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1">
                            Saturated
                          </span>
                        )}
                      </td>     
                     <td className="py-4.5 px-4 text-sm font-mono text-zinc-300 text-right">
                       {metrics.impressions.toLocaleString("en-US")}
                     </td>
                     <td className="py-4.5 px-4 text-sm font-mono text-zinc-300 text-right">
                       {metrics.expected_clicks.toLocaleString("en-US")}
                     </td>
                     <td className="py-4.5 px-4 text-sm font-mono text-[#3bf4ff] text-right font-medium">
                       {metrics.roas.toFixed(2)}x
                     </td>
                     <td className="py-4.5 px-4 text-sm font-mono text-emerald-400 text-right font-bold">
                       ${Math.round(metrics.predicted_revenue).toLocaleString("en-US")}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </motion.div>
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
