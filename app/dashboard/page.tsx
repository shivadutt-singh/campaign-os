"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Activity, 
  Terminal, 
  Loader2,
  Calendar,
  TrendingUp,
  Layers,
  ChevronRight,
  Plus,
  BarChart3,
  Clock,
  X,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  createdAt: string;
  budgetPayload: string;
  projectedRevenue: number;
  roi: number;
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const toggleSession = (idStr: string) => {
    const id = Number(idStr);
    setSelectedSessions(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length < 2) {
          return [...prev, id];
        }
        return prev;
      }
    });
  };

  const handleDelete = (indexToDelete: number) => {
    const itemToDelete = campaigns[indexToDelete];
    if (!itemToDelete) return;

    const updatedArray = campaigns.filter((_, idx) => idx !== indexToDelete);
    setCampaigns(updatedArray);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("campaignos_sessions", JSON.stringify(updatedArray));
    }

    const itemToDeleteIdNum = Number(itemToDelete.id);
    if (selectedSessions.includes(itemToDeleteIdNum) || selectedSessions.includes(indexToDelete)) {
      setSelectedSessions([]);
    }
  };

  const handleClearAll = () => {
    setCampaigns([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("campaignos_sessions");
    }
    setSelectedSessions([]);
  };

  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem("campaignos_sessions");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            setCampaigns(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse campaignos_sessions from localStorage", e);
        }
      }
    }

    // Fallback Mock Data for demo-ready presentation
    setCampaigns([
      {
        id: "1",
        createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        budgetPayload: JSON.stringify({ "Google Ads": 10000, "Facebook Ads": 8000, "LinkedIn Ads": 6500 }),
        projectedRevenue: 100000,
        roi: 308
      },
      {
        id: "2",
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        budgetPayload: JSON.stringify({ "Google Ads": 5000, "Facebook Ads": 3000, "LinkedIn Ads": 2000, "TikTok Ads": 1000 }),
        projectedRevenue: 40000,
        roi: 376
      },
      {
        id: "3",
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        budgetPayload: JSON.stringify({ "Google Ads": 15000, "Facebook Ads": 5000 }),
        projectedRevenue: 112000,
        roi: 460
      }
    ]);
    setLoading(false);
  }, []);

  const totalRevenue = campaigns.reduce((sum, c) => sum + c.projectedRevenue, 0);
  const avgROI = campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length) : 0;

  // Stagger animation configuration
  const containerVariants = {
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

  if (!isMounted) {
    return null;
  }

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
      <nav className="relative z-50 w-full border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 h-16 flex items-center justify-end px-8">
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

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Campaign History</h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Monitor, track, and restore previous ad budget optimizations saved in your workspace session.
            </p>
          </div>
          
          <Link href="/simulator">
            <button className="py-2.5 px-4 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-lg text-sm transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(59,244,255,0.3)] hover:scale-[1.02]">
              <Plus className="w-4 h-4" />
              New Simulation
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#3bf4ff] mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Loading Sessions...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-center min-h-[400px] bg-zinc-900/40 border border-white/10 rounded-3xl p-8 text-center"
          >
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl mb-5 text-zinc-500">
              <Clock className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No simulation history found</h3>
            <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
              Run a simulation first to generate and save predictive optimization sessions.
            </p>
            <Link href="/simulator">
              <button className="py-2.5 px-5 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(59,244,255,0.4)] flex items-center justify-center gap-2 cursor-pointer">
                <Rocket className="w-4 h-4" />
                Run Budget Simulation
              </button>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-8"
          >
            {/* Bento Summary Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                variants={itemVariants}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 text-zinc-500">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider">Saved Sessions</span>
                </div>
                <h3 className="text-3xl font-bold font-mono text-zinc-100">{campaigns.length}</h3>
                <p className="text-xs text-zinc-500 mt-2">Active historical sessions stored</p>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 text-zinc-500">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider">Total Projected Revenue</span>
                </div>
                <h3 className="text-3xl font-bold font-mono text-emerald-400">
                  ${totalRevenue.toLocaleString("en-US")}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">Sum of all simulation projections</p>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 text-zinc-500">
                  <BarChart3 className="w-4 h-4 text-[#3bf4ff]" />
                  <span className="text-xs font-mono uppercase tracking-wider">Average Session ROI</span>
                </div>
                <h3 className="text-3xl font-bold font-mono text-[#3bf4ff]">{avgROI}%</h3>
                <p className="text-xs text-zinc-500 mt-2">Overall dynamic conversion efficiency</p>
              </motion.div>
            </div>

            {/* Campaign History Data Grid */}
            <motion.div 
              variants={itemVariants}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#7b5ff0]/10 rounded-lg">
                    <Clock className="w-5 h-5 text-[#7b5ff0]" />
                  </div>
                  <h2 className="text-lg font-semibold">Simulation Log Entries</h2>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-400 cursor-pointer transition-colors py-1.5 px-3 rounded hover:bg-white/5"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                  <AnimatePresence>
                    {selectedSessions.length === 2 && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => setIsPanelOpen(true)}
                        className="py-2 px-4 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-lg text-xs transition-all flex items-center gap-2 hover:shadow-[0_0_15px_rgba(59,244,255,0.3)] hover:scale-[1.02]"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Analyze Scenarios
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="w-10 py-3.5 px-4"></th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Saved Time</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Budget Allocations</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Average ROI</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Projected Revenue</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Action</th>
                      <th className="w-10 py-3.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp, index) => {
                      const budgetsObj = JSON.parse(camp.budgetPayload);
                      const isSelected = selectedSessions.includes(Number(camp.id));
                      const isDisabled = !isSelected && selectedSessions.length >= 2;
                      return (
                        <tr 
                          key={camp.id}
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-all duration-150 group ${
                            isSelected ? "bg-white/[0.01]" : ""
                          }`}
                        >
                          <td className="py-4.5 px-4 w-10 text-center">
                            <label className="relative flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => toggleSession(camp.id)}
                              />
                              <div 
                                className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center
                                  ${isSelected 
                                    ? "border-[#3bf4ff] bg-[#3bf4ff]/10 text-[#3bf4ff]" 
                                    : "border-white/10 bg-[#0A0A0A] text-transparent hover:border-white/20"}
                                  ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                                `}
                              >
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </td>
                          <td className="py-4.5 px-4 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="font-mono text-xs">
                                {new Date(camp.createdAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="py-4.5 px-4 text-sm">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(budgetsObj).map(([ch, val]: [string, any]) => (
                                <span 
                                  key={ch} 
                                  className="text-[10px] font-mono px-2.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-300"
                                >
                                  {ch}: <strong className="text-zinc-100">${val.toLocaleString("en-US")}</strong>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4.5 px-4 text-sm font-mono text-[#3bf4ff] text-right font-medium">
                            {camp.roi}%
                          </td>
                          <td className="py-4.5 px-4 text-sm font-mono text-emerald-400 text-right font-bold">
                            ${camp.projectedRevenue.toLocaleString("en-US")}
                          </td>
                          <td className="py-4.5 px-4 text-right">
                            <Link href={`/simulator?id=${camp.id}`}>
                              <button className="py-1 px-3 border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 rounded-md text-xs font-semibold font-mono flex items-center gap-1 ml-auto group-hover:border-[#3bf4ff]/40 group-hover:text-white transition-colors">
                                Restore
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </Link>
                          </td>
                          <td className="py-4.5 px-4 text-center w-10">
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-neutral-600 hover:text-red-400 cursor-pointer transition-colors p-1.5 rounded hover:bg-white/5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
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

      {/* --- SMART ACTION SIDE-PANEL --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[500px] bg-[#0a0a0a] border-l border-white/10 z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Scenario Analysis</h3>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">Comparing selected campaign simulations</p>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(() => {
                  const selectedCampaigns = campaigns.filter(c => selectedSessions.includes(Number(c.id)));
                  const sortedSelected = [...selectedCampaigns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  const scenarioA = sortedSelected[0]; // older
                  const scenarioB = sortedSelected[1]; // newer

                  if (!scenarioA || !scenarioB) {
                    return (
                      <div className="text-zinc-500 text-sm font-mono py-12 text-center">
                        Select two sessions to compare.
                      </div>
                    );
                  }

                  const getSpend = (camp: Campaign) => {
                    try {
                      const budgetsObj = JSON.parse(camp.budgetPayload);
                      return Object.values(budgetsObj).reduce((sum: number, val: any) => sum + Number(val), 0);
                    } catch (e) {
                      return 0;
                    }
                  };

                  const spendA = getSpend(scenarioA);
                  const spendB = getSpend(scenarioB);
                  const deltaSpend = spendB - spendA;

                  const roiA = scenarioA.roi;
                  const roiB = scenarioB.roi;
                  const deltaRoi = roiB - roiA;

                  const revenueA = scenarioA.projectedRevenue;
                  const revenueB = scenarioB.projectedRevenue;
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

                  const budgetsA = JSON.parse(scenarioA.budgetPayload);
                  const budgetsB = JSON.parse(scenarioB.budgetPayload);
                  const allChannels = Array.from(new Set([...Object.keys(budgetsA), ...Object.keys(budgetsB)]));

                  return (
                    <div className="space-y-6">
                      {/* Scenario Meta Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Scenario A (Older)</div>
                          <div className="text-xs text-zinc-300 font-mono mt-1 font-semibold">{formatTime(scenarioA.createdAt)}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {scenarioA.id}</div>
                        </div>
                        <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Scenario B (Newer)</div>
                          <div className="text-xs text-zinc-300 font-mono mt-1 font-semibold">{formatTime(scenarioB.createdAt)}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {scenarioB.id}</div>
                        </div>
                      </div>

                      {/* Bento Matrix: Key Metrics comparison */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Spend Metric Card */}
                        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Spend</span>
                            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                              deltaSpend > 0 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                : deltaSpend < 0 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            }`}>
                              {deltaSpend === 0 ? "No Change" : deltaSpend > 0 ? `${formatDeltaMoney(deltaSpend)} Spend Increase` : `${formatDeltaMoney(deltaSpend)} Cost Saving`}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 items-end gap-2">
                            <div>
                              <div className="text-[10px] text-zinc-500 font-mono">A</div>
                              <div className="text-base font-bold font-mono text-zinc-300">${spendA.toLocaleString("en-US")}</div>
                            </div>
                            <div className="text-center pb-1 text-zinc-600">→</div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 font-mono">B</div>
                              <div className="text-base font-bold font-mono text-white">${spendB.toLocaleString("en-US")}</div>
                            </div>
                          </div>
                        </div>

                        {/* ROI Metric Card */}
                        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Average ROI</span>
                            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                              deltaRoi > 0 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : deltaRoi < 0 
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                  : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            }`}>
                              {deltaRoi === 0 ? "No Change" : `${formatDeltaPercent(deltaRoi)} ROI`}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 items-end gap-2">
                            <div>
                              <div className="text-[10px] text-zinc-500 font-mono">A</div>
                              <div className="text-base font-bold font-mono text-zinc-300">{roiA}%</div>
                            </div>
                            <div className="text-center pb-1 text-zinc-600">→</div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 font-mono">B</div>
                              <div className="text-base font-bold font-mono text-white">{roiB}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Projected Revenue Card */}
                        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3bf4ff]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Projected Revenue</span>
                            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                              deltaRevenue >= 0 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {deltaRevenue === 0 ? "No Change" : formatDeltaMoney(deltaRevenue)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 items-end gap-2">
                            <div>
                              <div className="text-[10px] text-zinc-500 font-mono">A</div>
                              <div className="text-base font-bold font-mono text-zinc-300">${revenueA.toLocaleString("en-US")}</div>
                            </div>
                            <div className="text-center pb-1 text-zinc-600">→</div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 font-mono">B</div>
                              <div className="text-lg font-black font-mono text-emerald-400">${revenueB.toLocaleString("en-US")}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Budget Channels Allocation Matrix */}
                      <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4 border-b border-white/5 pb-2">Channel Allocation Matrix</h4>
                        <div className="space-y-4">
                          {allChannels.map(ch => {
                            const valA = Number(budgetsA[ch] || 0);
                            const valB = Number(budgetsB[ch] || 0);
                            const diff = valB - valA;
                            
                            return (
                              <div key={ch} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-zinc-300 font-sans">{ch}</span>
                                  <span className={`font-mono text-[10px] ${diff > 0 ? "text-amber-400" : diff < 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                                    {diff === 0 ? "0" : diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
                                  <div>A: ${valA.toLocaleString("en-US")}</div>
                                  <div className="text-right">B: ${valB.toLocaleString("en-US")}</div>
                                </div>
                                {/* Stacked horizontal comparison bar */}
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                  {valA + valB > 0 ? (
                                    <>
                                      <div 
                                        className="h-full bg-zinc-600 transition-all duration-300"
                                        style={{ width: `${(valA / (valA + valB)) * 100}%` }}
                                      />
                                      <div 
                                        className="h-full bg-[#3bf4ff] transition-all duration-300"
                                        style={{ width: `${(valB / (valA + valB)) * 100}%` }}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-zinc-800" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    setSelectedSessions([]);
                    setIsPanelOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold font-mono transition-all"
                >
                  Clear Selection
                </button>
                
                {(() => {
                  const selectedCampaigns = campaigns.filter(c => selectedSessions.includes(Number(c.id)));
                  const sortedSelected = [...selectedCampaigns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  const scenarioB = sortedSelected[1];
                  if (!scenarioB) return null;
                  
                  return (
                    <Link href={`/simulator?id=${scenarioB.id}`} className="flex-1">
                      <button className="w-full py-2.5 px-4 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(59,244,255,0.2)]">
                        Restore Scenario B
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
