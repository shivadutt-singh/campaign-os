"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Rocket, TerminalSquare } from "lucide-react";
import BudgetSimulatorCard from "@/components/budgetsimulatorcard";
import ProbabilisticChart from "@/components/probabilisticchart";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState(50000);
  const [duration, setDuration] = useState(6);
  const [growth, setGrowth] = useState(15);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vh] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center max-w-3xl w-full"
      >
        {/* Environment Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium text-zinc-400 shadow-sm shadow-black/50"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Local Environment • NetElixir AIgnition 3.0
        </motion.div>

        {/* Main Headings */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-600 drop-shadow-sm">
          CampaignOS
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 mb-12 font-medium tracking-wide max-w-xl">
          Next-Gen B2B Digital Marketing Suite
        </p>

        {/* Team Motivation Card (Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl transition-all duration-500 group-hover:opacity-100 opacity-50" />
          
          <div className="relative p-8 rounded-2xl border border-white/10 bg-[#111111]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-80" />
            
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <blockquote className="text-xl md:text-2xl font-semibold text-zinc-200 mb-6 italic leading-relaxed">
              &quot;We are not just writing code; we are engineering the future of digital marketing. Let&apos;s make every commit count.&quot;
            </blockquote>

            <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-6 mt-2">
              <p className="text-sm text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <TerminalSquare className="w-4 h-4" /> Core Team
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2">
                  👑 Shivadutt
                </span>
                <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2">
                  🧠 Shani
                </span>
                <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2">
                  🎨 Vanshika
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-4xl mt-10">
          <BudgetSimulatorCard
            setIsLoading={setIsLoading}
            budget={budget}
            setBudget={setBudget}
            duration={duration}
            setDuration={setDuration}
            growth={growth}
            setGrowth={setGrowth}
          />

            <div className="mt-8 w-full">
              <ProbabilisticChart
                isLoading={isLoading}
                budget={budget}
                duration={duration}
                growth={growth}
              />
            </div>
        </div>


        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12"
        >
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Rocket className="w-4 h-4" />
            Initialize Workspace
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}
