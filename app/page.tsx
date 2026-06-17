"use client";

import { motion } from "framer-motion";
import { 
  Rocket, 
  TerminalSquare, 
  BrainCircuit, 
  LineChart, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  // Data for smart floating animations
  const floatingNodes = [
    { 
      id: 1, 
      text: "ROAS +24%", 
      color: "text-[#5df5a5]", 
      border: "border-[#5df5a5]/40", 
      bg: "bg-[#5df5a5]/10", 
      pos: "top-[20%] left-[2%] md:top-[30%] md:left-[10%]", 
      delay: 0 
    },
    { 
      id: 2, 
      text: "BAYESIAN BOUNDS", 
      color: "text-[#7b5ff0]", 
      border: "border-[#7b5ff0]/40", 
      bg: "bg-[#7b5ff0]/10", 
      pos: "top-[45%] left-[0%] md:top-[55%] md:left-[12%]", 
      delay: 2 
    },
    { 
      id: 3, 
      text: "LTV:CAC 3.2", 
      color: "text-[#ffe975]", 
      border: "border-[#ffe975]/40", 
      bg: "bg-[#ffe975]/10", 
      pos: "top-[70%] left-[2%] md:top-[75%] md:left-[8%]", 
      delay: 1 
    },
    { 
      id: 4, 
      text: "OFFLINE AI SYNC", 
      color: "text-[#f5d5ff]", 
      border: "border-[#f5d5ff]/40", 
      bg: "bg-[#f5d5ff]/10", 
      pos: "top-[25%] right-[2%] md:top-[35%] md:right-[12%]", 
      delay: 1.5 
    },
    { 
      id: 5, 
      text: "P(REV) > 95%", 
      color: "text-[#3bf4ff]", 
      border: "border-[#3bf4ff]/40", 
      bg: "bg-[#3bf4ff]/10", 
      pos: "top-[50%] right-[0%] md:top-[60%] md:right-[8%]", 
      delay: 0.5 
    },
    { 
      id: 6, 
      text: "CAC $42.50", 
      color: "text-[#5df5a5]", 
      border: "border-[#5df5a5]/40", 
      bg: "bg-[#5df5a5]/10", 
      pos: "top-[75%] right-[2%] md:top-[78%] md:right-[15%]", 
      delay: 2.5 
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#0d1117] text-white overflow-hidden font-sans selection:bg-[#3bf4ff] selection:text-black">
      
      {/* 1. Fixed Grid Background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Global Inline Styles for Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}} />

      {/* 2. Top Navigation Bar */}
      <nav className="relative z-50 w-full bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#7b5ff0] flex items-center justify-center font-bold text-black">
              C
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight">
              CampaignOS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#team" className="hover:text-white transition-colors">Team</Link>
          </div>
          <Link 
            href="/simulator" 
            className="px-3 py-2 md:px-4 md:py-2 bg-white text-black text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
          >
            Simulator <ArrowRight className="inline w-3 h-3 md:w-4 md:h-4 ml-1" />
          </Link>
        </div>
      </nav>

      {/* 3. Top Marquee Ticker */}
      <div className="relative z-10 w-full overflow-hidden flex whitespace-nowrap select-none border-b border-white/5 bg-[#0d1117]">
        <div className="flex animate-marquee min-w-[200%]">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex text-xs md:text-sm font-bold tracking-widest uppercase">
              <span className="bg-[#5df5a5] text-black px-4 md:px-6 py-2">2026</span>
              <span className="bg-[#f5d5ff] text-black px-4 md:px-6 py-2">CAMPAIGNOS</span>
              <span className="bg-white text-black px-4 md:px-6 py-2">AIGNITION</span>
              <span className="bg-[#7b5ff0] text-black px-4 md:px-6 py-2">NETELIXIR</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Hero Section with Smart Side Animations */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] px-4 pt-4 md:pt-10">
        
        {/* Floating Nodes - Clean Framer motion loops without Tailwind transition clashes */}
        {floatingNodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              y: [0, -15, 0] 
            }}
            transition={{
              opacity: { duration: 1, delay: node.delay },
              y: { 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                delay: node.delay 
              }
            }}
            className={`absolute flex items-center px-3 py-1.5
              md:px-4 md:py-2 rounded-full border ${node.border}
              ${node.bg} backdrop-blur-sm z-0 select-none
              pointer-events-none opacity-40 md:opacity-100
              scale-50 md:scale-100 ${node.pos}`}
          >
            <span className={`text-[10px] md:text-xs font-mono
              font-bold tracking-wider uppercase ${node.color}`}>
              {node.text}
            </span>
          </motion.div>
        ))}

        {/* Main Center Blocky Text */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-col items-center justify-center z-10 select-none w-full"
        >
          <div className="flex flex-col md:flex-row items-center md:items-end z-20">
            <div className="bg-[#5df5a5] text-black text-5xl md:text-7xl font-medium px-5 pt-2 pb-3 tracking-tight leading-none shadow-xl z-20 -mb-1 md:mb-0">
              Simulate
            </div>
            <div className="flex items-center z-10 -mb-1 md:mb-0">
              <div className="bg-[#ffe975] text-black text-4xl md:text-5xl font-medium px-4 py-3 tracking-tight leading-none shadow-xl">
                budgets
              </div>
              <div className="bg-white text-black text-3xl md:text-4xl font-medium px-4 py-3 tracking-tight leading-none shadow-xl">
                to
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start z-30 md:ml-12 mt-0">
            <div className="flex items-center z-20 -mb-1 md:mb-0">
              <div className="bg-[#7b5ff0] text-black text-4xl md:text-5xl font-medium px-5 py-3 tracking-tight leading-none shadow-xl">
                predict
              </div>
              <div className="bg-[#f5d5ff] text-black text-4xl md:text-5xl font-medium px-4 md:px-5 py-3 tracking-tight leading-none shadow-xl">
                expected
              </div>
            </div>
            <div className="bg-[#3bf4ff] text-black text-6xl md:text-8xl font-medium px-6 pt-2 pb-4 tracking-tight leading-none shadow-2xl z-30 md:-ml-2">
              revenue
            </div>
          </div>
        </motion.div>

        {/* CTA Button & Rocket */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative mt-12 md:mt-16 flex flex-col items-center z-40"
        >
          <div className="absolute -top-8 w-10 h-10 md:w-12 md:h-12 z-0">
            <Rocket className="w-full h-full text-[#7b5ff0] -rotate-45 drop-shadow-lg" fill="#f5d5ff" />
          </div>
          <Link 
            href="/simulator" 
            className="relative z-10 px-8 py-4 md:px-10 md:py-5 bg-white text-black font-bold text-sm md:text-lg uppercase tracking-widest hover:bg-zinc-200 hover:scale-105 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Launch Workspace
          </Link>
        </motion.div>
      </section>

      {/* Bottom Left 'N' Logo indicator */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-50">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg">
          N
        </div>
      </div>

      {/* 5. Features Section */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Core Engineering</h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl">
            Built strictly to NetElixir's commercial air-gapped constraints. No external runtime APIs, just pure local compute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="col-span-1 md:col-span-2 bg-[#161b22] border border-white/10 p-6 md:p-8 flex flex-col justify-between group hover:border-[#5df5a5]/50 transition-colors"
          >
            <div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#5df5a5]/10 text-[#5df5a5] flex items-center justify-center mb-6">
                <TerminalSquare className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">IPC Subprocess Bridge</h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md">
                Next.js securely spawns Python runtime instances via Node's <code className="bg-black px-1.5 py-0.5 rounded text-[#5df5a5]">child_process</code>. Eliminates the need for a persistent Python server.
              </p>
            </div>
          </motion.div>
          
          {/* Feature Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.1 }} 
            className="col-span-1 bg-[#161b22] border border-white/10 p-6 md:p-8 flex flex-col justify-between group hover:border-[#ffe975]/50 transition-colors"
          >
            <div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ffe975]/10 text-[#ffe975] flex items-center justify-center mb-6">
                <LineChart className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">Bayesian Bounds</h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Calculates deterministic Worst, Expected, and Best case revenue scenarios matrix.
              </p>
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.2 }} 
            className="col-span-1 bg-[#161b22] border border-white/10 p-6 md:p-8 flex flex-col justify-between group hover:border-[#f5d5ff]/50 transition-colors"
          >
            <div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#f5d5ff]/10 text-[#f5d5ff] flex items-center justify-center mb-6">
                <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">Offline AI Engine</h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Local deterministic mapping heuristics generate contextual causal insights without LLM API calls.
              </p>
            </div>
          </motion.div>

          {/* Feature Card 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.3 }} 
            className="col-span-1 md:col-span-2 bg-[#7b5ff0] text-black p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between group shadow-lg"
          >
            <div className="max-w-md">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Automated Deployment Ready</h3>
              <p className="text-black/80 text-sm md:text-base font-medium">
                Packaged with an executable <code className="bg-black/10 px-1.5 py-0.5 rounded text-black">run.sh</code> entrypoint for strict offline enterprise environments.
              </p>
            </div>
            <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 opacity-50 mt-6 md:mt-0" />
          </motion.div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#0a0f16] mt-12 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg">N</div>
            <span className="text-zinc-500 text-sm md:text-base font-medium tracking-wide">NetElixir AIgnition 3.0</span>
          </div>
          <div className="text-xs md:text-sm font-mono text-zinc-600 flex gap-4 md:gap-6 flex-wrap justify-center">
            <span>TEAM: SHIVADUTT • SHANI • VANSHIKA</span>
            <span className="hidden sm:inline">|</span>
            <span>VERSION: POC_1.0</span>
          </div>
        </div>
      </footer>

    </main>
  );
}