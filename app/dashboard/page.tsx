"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Clock
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
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
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
              <Link href="/simulator" className="hover:text-white transition-colors">
                Simulator
              </Link>
              <Link href="/dashboard" className="text-white border-b border-[#3bf4ff] pb-1 transition-all">
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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Saved Time</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Budget Allocations</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Average ROI</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Projected Revenue</th>
                      <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => {
                      const budgetsObj = JSON.parse(camp.budgetPayload);
                      return (
                        <tr 
                          key={camp.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-all duration-150 group"
                        >
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
    </div>
  );
}
