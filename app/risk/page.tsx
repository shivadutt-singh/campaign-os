"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  Activity,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";

interface Campaign {
  id: string;
  createdAt: string;
  budgetPayload: string;
  projectedRevenue: number;
  roi: number;
}

const channelParams: Record<string, { roi: number; cpc: number; ctr: number; cvr: number; threshold: number }> = {
  "Google Ads":   { roi: 8.8752, cpc: 0.4589,   ctr: 0.0412, cvr: 0.0520, threshold: 3418.15 },
  "Facebook Ads": { roi: 8.4362, cpc: 0.3632,   ctr: 0.0325, cvr: 0.0450, threshold: 1579.47 },
  "LinkedIn Ads": { roi: 1.50, cpc: 0.50,   ctr: 0.0200, cvr: 0.0300, threshold: 500.00 },
  "TikTok Ads":   { roi: 1.50, cpc: 0.50,   ctr: 0.0200, cvr: 0.0300, threshold: 500.00 },
  "Twitter Ads":  { roi: 1.40, cpc: 0.50,   ctr: 0.0200, cvr: 0.0300, threshold: 500.00 }
};

export default function RiskAnalysisPage() {
  const [sessions, setSessions] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("campaignos_sessions");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            setSessions(data);
            if (data.length > 0) {
              setSelectedSessionId(data[0].id);
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

  // Empty State
  if (!loading && sessions.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans selection:bg-[#3bf4ff] selection:text-black flex flex-col p-6 md:p-8 justify-center items-center overflow-hidden">
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
          className="relative z-10 max-w-md w-full text-center flex flex-col items-center bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-5 text-red-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Insufficient Data</h3>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Please run a budget simulation to generate a risk profile.
          </p>
          <Link href="/simulator" className="w-full">
            <button className="w-full py-3 px-5 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(59,244,255,0.4)] flex items-center justify-center gap-2 cursor-pointer">
              <Sliders className="w-4 h-4" />
              Launch Simulator Workspace
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const budgets = selectedSession ? JSON.parse(selectedSession.budgetPayload) : {};

  const getChannelMetrics = (ch: string, spend: number) => {
    const p = channelParams[ch] || { roi: 1.5, cpc: 0.5, ctr: 0.02, cvr: 0.03, threshold: 500.0 };
    const thresholdTotal = p.threshold * 10;
    const saturationWarning = spend > thresholdTotal;
    
    let channelRevenue = 0;
    if (!saturationWarning) {
      channelRevenue = spend * p.roi;
    } else {
      channelRevenue = (thresholdTotal * p.roi) + (thresholdTotal * p.roi * Math.log(1.0 + (spend - thresholdTotal) / thresholdTotal));
    }
    
    const roas = spend > 0 ? channelRevenue / spend : 0;
    
    let risk: "Low" | "Medium" | "High" = "Low";
    if (roas > 3.0) risk = "Low";
    else if (roas >= 2.0) risk = "Medium";
    else risk = "High";
    
    return {
      revenue: channelRevenue,
      roas: Number(roas.toFixed(2)),
      risk
    };
  };

  const getRiskMeterPercentage = (roas: number) => {
    if (roas < 2.0) {
      return Math.max(80, Math.min(100, Math.round(100 - (roas / 2.0) * 20)));
    } else if (roas <= 3.0) {
      return Math.max(40, Math.min(79, Math.round(80 - (roas - 2.0) * 40)));
    } else {
      return Math.max(10, Math.min(39, Math.round(40 - ((roas - 3.0) / 3.0) * 30)));
    }
  };

  const channelsData = Object.entries(budgets).map(([ch, val]: [string, any]) => {
    const spend = Number(val);
    const metrics = getChannelMetrics(ch, spend);
    return {
      name: ch,
      budget: spend,
      revenue: metrics.revenue,
      roas: metrics.roas,
      risk: metrics.risk
    };
  });

  const highRiskChannels = channelsData.filter(c => c.risk === "High");

  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans selection:bg-[#3bf4ff] selection:text-black flex flex-col p-6 md:p-8 overflow-x-hidden">
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
        className="relative z-10 w-full max-w-[1000px] mx-auto flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Risk & Saturation Analysis</h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Real-time monitoring of diminishing returns across your active budget allocations.
          </p>
        </motion.div>

        {/* Dropdown Selector */}
        <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 w-full flex items-center gap-4">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Target Simulation</label>
            <select 
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3bf4ff] font-mono cursor-pointer"
            >
              {sessions.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Simulation #{sessions.length - idx} (Rev: ${s.projectedRevenue.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <motion.div 
          variants={pageVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {channelsData.map((ch) => {
            const riskConfig = {
              Low: {
                bg: "bg-emerald-500/10 border-emerald-500/20",
                text: "text-emerald-400",
                bar: "bg-emerald-400",
                insight: "Capital efficiency is high. Room for scaling."
              },
              Medium: {
                bg: "bg-amber-500/10 border-amber-500/20",
                text: "text-amber-400",
                bar: "bg-amber-400",
                insight: "Approaching efficiency bounds. Monitor closely."
              },
              High: {
                bg: "bg-red-500/10 border-red-500/20",
                text: "text-red-500",
                bar: "bg-red-500",
                insight: "Saturation threshold breached. Budget reallocation strongly advised."
              }
            }[ch.risk];

            const fillPercent = getRiskMeterPercentage(ch.roas);

            return (
              <motion.div
                key={ch.name}
                variants={itemVariants}
                className={`${riskConfig.bg} border rounded-2xl p-6 flex flex-col justify-between gap-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
              >
                {/* Visual indicator glow/blob */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${ch.risk === "High" ? "bg-red-500/5" : ch.risk === "Medium" ? "bg-amber-500/5" : "bg-emerald-500/5"} rounded-full blur-2xl pointer-events-none`} />
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{ch.name}</h3>
                    <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${riskConfig.bg} ${riskConfig.text}`}>
                      {ch.risk} Risk
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Allocated Spend</span>
                    <span className="text-xl font-bold font-mono text-neutral-200">
                      ${ch.budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Risk Meter Progress Bar */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-400 font-sans">Risk Meter</span>
                    <span className={`${riskConfig.text} font-bold`}>{fillPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full ${riskConfig.bar} transition-all duration-500`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Channel Metrics Stats row */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-500 font-bold">Channel ROAS</span>
                    <span className="text-base font-bold font-mono text-neutral-200">{ch.roas.toFixed(2)}x</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-500 font-bold">Est. Revenue</span>
                    <span className="text-base font-bold font-mono text-emerald-400">${Math.round(ch.revenue).toLocaleString()}</span>
                  </div>
                </div>

                {/* AI Insight Text */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] uppercase font-mono text-neutral-500 mb-1">AI Recommendation</div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {riskConfig.insight}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Actionable Waste Mitigation Insights */}
        <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <Sparkles className="w-5 h-5 text-[#3bf4ff]" />
            <h2 className="text-base font-semibold">Causal Insights & Recommendations</h2>
          </div>

          <div className="space-y-4">
            {highRiskChannels.length === 0 ? (
              <div className="flex gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs leading-relaxed">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>All advertising channels are performing within optimal Bayesian parameters. Saturation curves indicate minimal waste. No mitigation is necessary.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {highRiskChannels.map(ch => (
                  <div key={ch.name} className="flex gap-3 p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-xl text-xs leading-relaxed">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <div className="flex flex-col gap-1">
                      <strong className="text-white text-sm font-semibold">{ch.name} Saturation Alert</strong>
                      <span>
                        The allocated budget of <strong className="text-white font-mono">${ch.budget.toLocaleString()}</strong> has pushed this channel into diminishing returns (ROAS is at {ch.roas.toFixed(2)}x). To mitigate waste, we recommend shifting at least <strong className="text-white font-mono">${Math.round(ch.budget * 0.2).toLocaleString()}</strong> of this budget to lower-saturated channels or launching new creative sets to reset standard decay boundaries.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
