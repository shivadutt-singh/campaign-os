"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Activity,
  Layers,
  Sliders,
  Printer,
  Sparkles,
  Download,
  Calendar,
  ChevronRight,
  Trash2
} from "lucide-react";

interface Campaign {
  id: string;
  createdAt: string;
  budgetPayload: string;
  projectedRevenue: number;
  roi: number;
}

interface ClientReport {
  id: string;
  generatedAt: string;
  clientName: string;
  simulationId: string;
  revenue: number;
  roi: number;
}

export default function ClientReportsPage() {
  const [sessions, setSessions] = useState<Campaign[]>([]);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("Acme Corporation");

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const rawSessions = localStorage.getItem("campaignos_sessions");
      if (rawSessions) {
        try {
          const sessionsData = JSON.parse(rawSessions);
          if (Array.isArray(sessionsData)) {
            setSessions(sessionsData);
            if (sessionsData.length > 0) {
              setSelectedSessionId(sessionsData[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to parse sessions", e);
        }
      }

      const rawReports = localStorage.getItem("campaignos_reports");
      if (rawReports) {
        try {
          const reportsData = JSON.parse(rawReports);
          if (Array.isArray(reportsData)) {
            setReports(reportsData);
          }
        } catch (e) {
          console.error("Failed to parse reports log", e);
        }
      }
    }
    setLoading(false);
  }, []);

  if (!isMounted) return null;

  // Empty State / notice state
  if (!loading && sessions.length === 0) {
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
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No simulations detected</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You need to run budget predictions in the simulator workspace and save them before you can compile client briefs.
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

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const getSpend = (camp: Campaign) => {
    try {
      const budgetsObj = JSON.parse(camp.budgetPayload);
      return Object.values(budgetsObj).reduce((sum: number, val: any) => sum + Number(val), 0);
    } catch {
      return 0;
    }
  };

  const activeSpend = selectedSession ? getSpend(selectedSession) : 0;
  const activeBudgets = selectedSession ? JSON.parse(selectedSession.budgetPayload) : {};

  const handlePrint = () => {
    if (!selectedSession) return;

    const newReport: ClientReport = {
      id: String(Date.now()),
      generatedAt: new Date().toISOString(),
      clientName: clientName,
      simulationId: selectedSession.id,
      revenue: selectedSession.projectedRevenue,
      roi: selectedSession.roi
    };

    const existingReports = localStorage.getItem("campaignos_reports");
    let currentReports: ClientReport[] = [];
    if (existingReports) {
      try {
        currentReports = JSON.parse(existingReports);
      } catch {}
    }

    currentReports.unshift(newReport);
    localStorage.setItem("campaignos_reports", JSON.stringify(currentReports));
    setReports(currentReports);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleRePrint = (rep: ClientReport) => {
    setClientName(rep.clientName);
    setSelectedSessionId(rep.simulationId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDeleteReport = (indexToDelete: number) => {
    const updated = reports.filter((_, idx) => idx !== indexToDelete);
    setReports(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("campaignos_reports", JSON.stringify(updated));
    }
  };

  const handleClearAllReports = () => {
    setReports([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("campaignos_reports");
    }
  };

  const getFutureDateString = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      {/* CSS print overrides styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
            color: black !important;
          }
          aside, nav, .no-print, button, select, input, footer, .print\\:hidden, [class*="print:hidden"] {
            display: none !important;
          }
          main, html, .relative {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            position: relative !important;
          }
          .print-section {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
          }
        }
      `}} />

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
      <nav className="relative z-50 w-full border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 h-16 flex items-center justify-end px-4 mb-8 no-print print:hidden">
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
        <motion.div variants={itemVariants} className="flex flex-col gap-2 no-print">
          <h1 className="text-3xl font-bold tracking-tight">Client Reports</h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Configure, preview, and generate print-ready executive PDF briefs summarizing budget forecasts.
          </p>
        </motion.div>

        {/* Configuration Panel */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-4 bg-zinc-900/40 border border-white/10 rounded-2xl p-5 w-full no-print">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Target Simulation</label>
            <select 
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3bf4ff] font-mono cursor-pointer"
            >
              {sessions.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Simulation #{sessions.length - idx} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Client / Agency Name</label>
            <input 
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corp Ltd"
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3bf4ff] font-sans"
            />
          </div>
        </motion.div>

        {/* Branded Client Brief Preview */}
        {selectedSession && (
          <motion.div variants={itemVariants} className="w-full flex flex-col gap-6">
            <div className="bg-white text-black p-12 max-w-4xl mx-auto shadow-2xl rounded-sm font-sans mt-8 print-section w-full print:shadow-none print:w-full print:max-w-none print:p-[20mm]">
              {/* Professional Header */}
              <div className="flex justify-between items-baseline border-b-2 border-black pb-4 mb-8">
                <span className="text-2xl font-bold tracking-tight text-black">CampaignOS</span>
                <div className="text-gray-500 text-sm font-sans flex gap-4">
                  <span>{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>ID: {selectedSession.id}</span>
                </div>
              </div>

              {/* 7-Section Document Layout */}
              <div className="space-y-10">
                {/* 1. Executive Summary */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">1. Executive Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm text-gray-700">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-medium">Campaign Name</span>
                      <span className="font-semibold text-black">AIgnition Q3 Scale ({selectedSession.id.slice(-6)})</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-medium">Client / Product</span>
                      <span className="font-semibold text-black">{clientName || "Acme Corp"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-medium">Brief Author</span>
                      <span className="font-semibold text-black">CampaignOS PIO Engine</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-medium">Date</span>
                      <span className="font-semibold text-black">{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "Strategic budget allocation optimized by predictive AI to maximize ROAS and projected revenue."
                  </p>
                </div>

                {/* 2. Objectives (KPIs) */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">2. Objectives (KPIs)</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-black min-w-[120px]">Primary Goal:</span>
                      <span className="text-gray-700">Maximize Projected Revenue to <strong className="font-mono text-black font-semibold">${selectedSession.projectedRevenue.toLocaleString()}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-black min-w-[120px]">Secondary Goal:</span>
                      <span className="text-gray-700">Maintain global campaign ROI at <strong className="font-mono text-black font-semibold">{selectedSession.roi}%</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-black min-w-[120px]">Success Metrics:</span>
                      <span className="text-gray-700">Platform-reported ROAS, CPA, and Causal Insight Saturation limits.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Target Audience */}
                <div className="break-inside-avoid print:break-inside-avoid">
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">3. Target Audience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                      <div className="font-bold mb-1.5 uppercase text-[10px] tracking-wider text-gray-500">Demographics</div>
                      <p className="text-gray-700 leading-relaxed">Data-driven custom intent audiences & lookalikes.</p>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                      <div className="font-bold mb-1.5 uppercase text-[10px] tracking-wider text-gray-500">Psychographics</div>
                      <p className="text-gray-700 leading-relaxed">High-intent users exhibiting bottom-of-funnel conversion signals.</p>
                    </div>
                  </div>
                </div>

                {/* 4. Financial Plan & Budget Breakdown */}
                <div className="prevent-break break-inside-avoid print:break-inside-avoid">
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">4. Financial Plan & Budget Breakdown</h3>
                  <div className="w-full border border-gray-200 rounded-sm overflow-hidden">
                    <table className="w-full border-collapse text-left text-sm text-black">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-black">
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Estimated Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {Object.entries(activeBudgets).map(([ch, val]: [string, any]) => (
                          <tr key={ch}>
                            <td className="py-3 px-4 font-semibold text-black">Paid Media ({ch})</td>
                            <td className="py-3 px-4">Predictive optimized budget allocation.</td>
                            <td className="py-3 px-4 text-right font-mono text-black">${Number(val).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="py-3 px-4 font-semibold text-black">Agency Fee (Retainer)</td>
                          <td className="py-3 px-4">Monthly agency retainer fee.</td>
                          <td className="py-3 px-4 text-right font-mono text-black">$0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-black">Software & Tools</td>
                          <td className="py-3 px-4">Platform license & analytics fees.</td>
                          <td className="py-3 px-4 text-right font-mono text-black">$0.00</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold border-t-2 border-black text-black">
                          <td className="py-3.5 px-4" colSpan={2}>Total Budget</td>
                          <td className="py-3.5 px-4 text-right font-mono text-lg text-black">${activeSpend.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Deliverables & Scope */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">5. Deliverables & Scope</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-black rounded-full" />
                      <span>1. Predictive Budget Matrix</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-black rounded-full" />
                      <span>2. Real-time Causal Insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-black rounded-full" />
                      <span>3. Executive PDF Brief</span>
                    </li>
                  </ul>
                </div>

                {/* 6. Timeline and Milestones */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">6. Timeline and Milestones</h3>
                  <div className="grid grid-cols-3 gap-6 mt-4 prevent-break">
                    <div className="border border-gray-200 bg-gray-50/50 rounded p-6 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2">LAUNCH DATE</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">July 14, 2026</span>
                    </div>
                    <div className="border border-gray-200 bg-gray-50/50 rounded p-6 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2">MID-CAMPAIGN CHECK-IN</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">July 28, 2026</span>
                    </div>
                    <div className="border border-gray-200 bg-gray-50/50 rounded p-6 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2">FINAL DELIVERABLES</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">September 5, 2026</span>
                    </div>
                  </div>
                </div>

                {/* 7. Stakeholders & Approvals */}
                <div className="prevent-break break-inside-avoid print:break-inside-avoid pb-12 print:pb-12">
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-black">7. Stakeholders & Approvals</h3>
                  <div className="grid grid-cols-3 gap-12 mt-12 mb-8 prevent-break">
                    <div className="flex flex-col items-center justify-end h-24">
                      <div className="w-full border-t border-gray-400 mb-4"></div>
                      <span className="font-semibold text-gray-900 text-sm">Client Approver</span>
                    </div>
                    <div className="flex flex-col items-center justify-end h-24">
                      <div className="w-full border-t border-gray-400 mb-4"></div>
                      <span className="font-semibold text-gray-900 text-sm">Agency Lead</span>
                    </div>
                    <div className="flex flex-col items-center justify-end h-24">
                      <div className="w-full border-t border-gray-400 mb-4"></div>
                      <span className="font-semibold text-gray-900 text-sm">Date</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400 font-sans">
                <div>Generated by CampaignOS PIO | NetElixir AIgnition</div>
                <div>Page 1 of 1</div>
              </div>
            </div>

            {/* PDF Generate Trigger Button */}
            <button
              onClick={handlePrint}
              className="py-3 px-6 bg-[#3bf4ff] hover:bg-[#2ed6df] text-black font-semibold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(59,244,255,0.4)] flex items-center justify-center gap-2 mt-4 no-print print:hidden self-end w-full md:w-auto"
            >
              <Printer className="w-4 h-4" />
              Generate Client PDF Brief
            </button>
          </motion.div>
        )}

        {/* Report Log Table */}
        <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4 no-print print:hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#3bf4ff]" />
              <h2 className="text-base font-semibold">Report Generation Log</h2>
            </div>
            {reports.length > 0 && (
              <button 
                onClick={handleClearAllReports}
                className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors py-1.5 px-3 rounded hover:bg-white/5"
              >
                <Trash2 size={14} />
                Clear Logs
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Client Name</th>
                  <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Export Date</th>
                  <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Projected Yield</th>
                  <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold text-right">Action</th>
                  <th className="w-10 py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-xs font-mono py-8 text-zinc-500">
                      No reports generated yet. Export a simulation to create a report log.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep, index) => (
                    <tr key={rep.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-zinc-300">{rep.clientName}</td>
                      <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                        {new Date(rep.generatedAt).toLocaleString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-emerald-400 text-right font-bold">${rep.revenue.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          SUCCESS
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleRePrint(rep)}
                          className="py-1 px-3 border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 rounded-md text-xs font-mono flex items-center gap-1 ml-auto transition-colors"
                        >
                          Re-export
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center w-10">
                        <button
                          onClick={() => handleDeleteReport(index)}
                          className="text-neutral-600 hover:text-red-400 cursor-pointer transition-colors p-2 rounded hover:bg-white/5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
