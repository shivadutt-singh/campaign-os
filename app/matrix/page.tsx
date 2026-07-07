"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  GitCompare,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  ArrowRight,
  Sliders,
  Sparkles
} from "lucide-react";

interface Campaign {
  id: string;
  createdAt: string;
  budgetPayload: string;
  projectedRevenue: number;
  roi: number;
}

export default function ScenarioMatrixPage() {
  const [sessions, setSessions] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAId, setSelectedAId] = useState<string>("");
  const [selectedBId, setSelectedBId] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("campaignos_sessions");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            setSessions(data);
            if (data.length >= 2) {
              setSelectedAId(data[1].id);
              setSelectedBId(data[0].id);
            } else if (data.length === 1) {
              setSelectedAId(data[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to parse campaignos_sessions", e);
        }
      }
    }
    setLoading(false);
  }, []);

  if (!isMounted) return null;

  // Empty State / Under-limit state
  if (!loading && sessions.length < 2) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#3bf4ff] selection:text-black flex flex-col p-6 md:p-8 justify-center items-center overflow-hidden">
        {/* Background Grid */}
        <div 
          className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative z-10 max-w-md w-full text-center flex flex-col items-center bg-zinc-900/40 border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <div className="p-4 bg-[#7b5ff0]/10 border border-[#7b5ff0]/20 rounded-2xl mb-5 text-[#7b5ff0]">
            <GitCompare className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Insufficient Simulations</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            {sessions.length === 0 
              ? "No simulations detected. Run budget predictions in the simulator workspace first."
              : "You have 1 saved simulation. Run at least 2 budget predictions to compare Baseline vs. Target scenarios."}
          </p>
          <Link href="/simulator" className="w-full">
            <button className="w-full py-3 px-5 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(59,244,255,0.4)] flex items-center justify-center gap-2">
              <Sliders className="w-4 h-4" />
              Launch Simulator Workspace
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const scenarioA = sessions.find(s => s.id === selectedAId);
  const scenarioB = sessions.find(s => s.id === selectedBId);

  const getSpend = (camp: Campaign) => {
    try {
      const budgetsObj = JSON.parse(camp.budgetPayload);
      return Object.values(budgetsObj).reduce((sum: number, val: any) => sum + Number(val), 0);
    } catch {
      return 0;
    }
  };

  const spendA = scenarioA ? getSpend(scenarioA) : 0;
  const spendB = scenarioB ? getSpend(scenarioB) : 0;
  const deltaSpend = spendB - spendA;

  const roiA = scenarioA ? scenarioA.roi : 0;
  const roiB = scenarioB ? scenarioB.roi : 0;
  const deltaRoi = roiB - roiA;

  const revenueA = scenarioA ? scenarioA.projectedRevenue : 0;
  const revenueB = scenarioB ? scenarioB.projectedRevenue : 0;
  const deltaRevenue = revenueB - revenueA;

  const formatDeltaMoney = (val: number) => {
    const sign = val >= 0 ? "+" : "-";
    return `${sign}$${Math.abs(val).toLocaleString("en-US")}`;
  };

  const formatDeltaPercent = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val}%`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const budgetsA = scenarioA ? JSON.parse(scenarioA.budgetPayload) : {};
  const budgetsB = scenarioB ? JSON.parse(scenarioB.budgetPayload) : {};
  const allChannels = Array.from(new Set([...Object.keys(budgetsA), ...Object.keys(budgetsB)]));

  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#3bf4ff] selection:text-black flex flex-col p-6 md:p-8 overflow-x-hidden">
      {/* Background Grid */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header status info */}
      <nav className="relative z-50 w-full border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 h-16 flex items-center justify-end px-4 mb-8">
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
      </nav>

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Scenario Matrix</h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Perform delta comparison between baseline and target simulation models in real-time.
          </p>
        </motion.div>

        {/* Dropdown Selectors */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900/40 border border-white/10 rounded-2xl p-5 w-full">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Baseline Scenario (Scenario A)</label>
            <select 
              value={selectedAId}
              onChange={(e) => setSelectedAId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3bf4ff] font-mono cursor-pointer"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {formatTime(s.createdAt)} — ${s.projectedRevenue.toLocaleString()} Revenue
                </option>
              ))}
            </select>
          </div>
          <div className="text-zinc-600 text-xs font-mono font-bold hidden md:block pt-4">VS</div>
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Target Scenario (Scenario B)</label>
            <select 
              value={selectedBId}
              onChange={(e) => setSelectedBId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3bf4ff] font-mono cursor-pointer"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {formatTime(s.createdAt)} — ${s.projectedRevenue.toLocaleString()} Revenue
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {selectedAId === selectedBId ? (
          <motion.div variants={itemVariants} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-center text-xs font-mono">
            ⚠️ Baseline and Target Scenarios are identical. Please select different scenarios above to analyze comparison deltas.
          </motion.div>
        ) : (
          <>
            {/* Bento Comparison Cards */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
              {/* Scenario A Card */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Baseline Scenario A</span>
                  <span className="text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    {scenarioA ? formatTime(scenarioA.createdAt) : ""}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Total Spend</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">${spendA.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Projected Revenue</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">${revenueA.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Average ROI</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">{roiA}%</span>
                  </div>
                </div>
              </div>

              {/* Scenario B Card */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3bf4ff]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#3bf4ff] font-bold">Target Scenario B</span>
                  <span className="text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    {scenarioB ? formatTime(scenarioB.createdAt) : ""}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Total Spend</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">${spendB.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Projected Revenue</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">${revenueB.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-zinc-400">Average ROI</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">{roiB}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Delta calculations */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
              {/* Spend Delta */}
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 hover:border-white/20 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Spend Delta</span>
                <h3 className={`text-2xl font-bold font-mono ${
                  deltaSpend > 0 
                    ? "text-amber-400" 
                    : deltaSpend < 0 
                      ? "text-emerald-400" 
                      : "text-zinc-400"
                }`}>
                  {deltaSpend === 0 ? "No Change" : formatDeltaMoney(deltaSpend)}
                </h3>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {deltaSpend === 0 ? "Identical spend" : deltaSpend > 0 ? "Increased budget required" : "Budget efficiency savings"}
                </span>
              </div>

              {/* Revenue Delta */}
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 hover:border-white/20 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Revenue Delta</span>
                <h3 className={`text-2xl font-bold font-mono ${
                  deltaRevenue > 0 
                    ? "text-emerald-400" 
                    : deltaRevenue < 0 
                      ? "text-red-400" 
                      : "text-zinc-400"
                }`}>
                  {deltaRevenue === 0 ? "No Change" : formatDeltaMoney(deltaRevenue)}
                </h3>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {deltaRevenue === 0 ? "Identical revenue" : deltaRevenue > 0 ? "Revenue expansion growth" : "Revenue drop forecast"}
                </span>
              </div>

              {/* ROI Delta */}
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 hover:border-white/20 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">ROI Delta</span>
                <h3 className={`text-2xl font-bold font-mono ${
                  deltaRoi > 0 
                    ? "text-emerald-400" 
                    : deltaRoi < 0 
                      ? "text-red-400" 
                      : "text-zinc-400"
                }`}>
                  {deltaRoi === 0 ? "No Change" : formatDeltaPercent(deltaRoi)}
                </h3>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {deltaRoi === 0 ? "Identical conversion" : deltaRoi > 0 ? "Conversion efficiency boost" : "Efficiency drop risk"}
                </span>
              </div>
            </motion.div>

            {/* Channel-by-Channel Breakdown Table */}
            <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                <Sparkles className="w-5 h-5 text-[#3bf4ff]" />
                <h2 className="text-base font-semibold">Budget Allocation Delta Matrix</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Channel</th>
                      <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Baseline A</th>
                      <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Target B</th>
                      <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Budget Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allChannels.map(ch => {
                      const valA = Number(budgetsA[ch] || 0);
                      const valB = Number(budgetsB[ch] || 0);
                      const diff = valB - valA;
                      
                      return (
                        <tr key={ch} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-4 text-sm font-medium text-zinc-300">{ch}</td>
                          <td className="py-4 px-4 text-sm font-mono text-zinc-400 text-right">${valA.toLocaleString()}</td>
                          <td className="py-4 px-4 text-sm font-mono text-zinc-300 text-right">${valB.toLocaleString()}</td>
                          <td className={`py-4 px-4 text-sm font-mono text-right font-semibold ${
                            diff > 0 
                              ? "text-amber-400" 
                              : diff < 0 
                                ? "text-emerald-400" 
                                : "text-zinc-500"
                          }`}>
                            {diff === 0 ? "—" : diff > 0 ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
