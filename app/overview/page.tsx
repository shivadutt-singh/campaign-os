"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sliders,
  AlertTriangle,
  Save,
  GitCompare,
  ArrowRight,
  TrendingUp,
  Layers,
  BarChart3,
  Activity
} from "lucide-react";

interface Campaign {
  id: string;
  createdAt: string;
  budgetPayload: string;
  projectedRevenue: number;
  roi: number;
}

export default function OverviewPage() {
  const [sessions, setSessions] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("campaignos_sessions");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            setSessions(data);
          }
        } catch (e) {
          console.error("Failed to parse campaignos_sessions", e);
        }
      }
    }
    setLoading(false);
  }, []);

  // Compute platform metrics
  const getSessionSpend = (budgetPayload: string) => {
    try {
      const budgets = JSON.parse(budgetPayload);
      return Object.values(budgets).reduce((sum: number, val: any) => sum + Number(val), 0);
    } catch {
      return 0;
    }
  };

  const totalSpend = sessions.reduce((sum, s) => sum + getSessionSpend(s.budgetPayload), 0);
  const totalRevenue = sessions.reduce((sum, s) => sum + Number(s.projectedRevenue), 0);
  const globalAverageRoas = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + Number(s.roi), 0) / sessions.length)
    : 0;

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
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100, 
        damping: 18 
      } 
    }
  };

  if (!isMounted) {
    return null;
  }

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Explore platform aggregation metrics and read the step-by-step workflow guide to master the CampaignOS simulation workspace.
          </p>
        </motion.div>

        {/* Bento Stat Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6 animate-pulse">
            <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl" />
            <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl" />
            <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl" />
          </div>
        ) : (
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {/* Total Spend */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/20 hover:bg-zinc-900/60 transition-all">
              <div className="flex items-center gap-2.5 text-zinc-500">
                <Layers className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Total Platform Spend</span>
              </div>
              <h3 className={`text-3xl font-bold font-mono mt-1 ${totalSpend > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                ${totalSpend.toLocaleString("en-US")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Aggregated allocated ad budget across all saved sessions</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/20 hover:bg-zinc-900/60 transition-all">
              <div className="flex items-center gap-2.5 text-zinc-500">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Total Projected Revenue</span>
              </div>
              <h3 className={`text-3xl font-bold font-mono mt-1 ${totalRevenue > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                ${totalRevenue.toLocaleString("en-US")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Aggregated projected revenue yield across all sessions</p>
            </div>

            {/* Global average ROAS */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-2 hover:border-white/20 hover:bg-zinc-900/60 transition-all">
              <div className="flex items-center gap-2.5 text-zinc-500">
                <Activity className="w-4 h-4 text-[#3bf4ff]" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Global Average ROAS</span>
              </div>
              <h3 className={`text-3xl font-bold font-mono mt-1 ${globalAverageRoas > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                {globalAverageRoas}%
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Average return on advertising spend efficiency</p>
            </div>
          </motion.div>
        )}

        {/* Workflow Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1 text-white">System Architecture & Workflow</h2>
            <p className="text-xs text-neutral-400 font-mono">Understand how predictive models drive budget allocations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 transition-all group">
              <div className="text-[40px] font-mono font-bold text-white/5 absolute top-2 right-4 select-none">
                01
              </div>
              <div className="p-2.5 bg-[#3bf4ff]/10 border border-[#3bf4ff]/20 rounded-xl w-fit text-[#3bf4ff] group-hover:scale-105 transition-transform duration-200">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Predictive Simulation</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Input target revenue in the Simulator. The Goal-Seek Engine calculates optimal channel budgets using historical Bayesian boundaries.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 transition-all group">
              <div className="text-[40px] font-mono font-bold text-white/5 absolute top-2 right-4 select-none">
                02
              </div>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit text-amber-400 group-hover:scale-105 transition-transform duration-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Saturation Monitoring</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Review the Causal Insights Log. The engine automatically flags channels hitting diminishing returns to prevent ad spend waste.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 transition-all group">
              <div className="text-[40px] font-mono font-bold text-white/5 absolute top-2 right-4 select-none">
                03
              </div>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Session Archiving</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Save your projected forecasts. Real-time local persistence stores your scenarios for future comparison.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 transition-all group">
              <div className="text-[40px] font-mono font-bold text-white/5 absolute top-2 right-4 select-none">
                04
              </div>
              <div className="p-2.5 bg-[#7b5ff0]/10 border border-[#7b5ff0]/20 rounded-xl w-fit text-[#7b5ff0] group-hover:scale-105 transition-transform duration-200">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Scenario Analysis</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Navigate to History. Select any two saved sessions to open the Scenario Matrix and analyze the exact mathematical Delta in ROI.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Launch Section */}
        <motion.div variants={itemVariants} className="w-full mt-2 flex justify-start">
          <Link href="/simulator">
            <button className="inline-flex items-center gap-2 py-3 px-6 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-lg text-sm transition-all hover:shadow-[0_0_20px_rgba(59,244,255,0.4)] hover:scale-[1.02] group">
              Launch Simulator
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-150" />
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
