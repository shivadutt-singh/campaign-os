"use client";

// FIX: Imported 'Variants' from framer-motion for strict TypeScript typing
import { motion, Variants } from "framer-motion";
import { 
  Monitor, 
  Server, 
  Cpu, 
  Database, 
  ArrowDown, 
  FileJson,
  Activity,
  Network
} from "lucide-react";
import Link from "next/link";

// FIX: Explicitly typed as Variants to resolve the VS Code TS Error
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// FIX: Explicitly typed as Variants so "spring" isn't read as a generic string
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 120 } 
  }
};

export default function ArchitecturePage() {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#7b5ff0] selection:text-white flex flex-col">
      
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
              System Architecture
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/simulator" 
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-semibold text-white transition-colors"
            >
              Back to Simulator
            </Link>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-12 flex flex-col gap-16">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
          <div className="px-3 py-1 bg-[#7b5ff0]/10 border border-[#7b5ff0]/30 text-[#7b5ff0] text-xs font-mono rounded-full flex items-center gap-2">
            <Network className="w-3.5 h-3.5" />
            ZERO-DEPENDENCY PIPELINE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Air-Gapped Compute Architecture
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Designed strictly for commercial offline environments. 
            The system isolates the React presentation layer from the Python mathematical 
            engine using secure IPC bridges and ephemeral I/O storage.
          </p>
        </div>

        {/* --- VISUAL ARCHITECTURE GRAPH --- */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="relative w-full bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col items-center"
        >
          {/* TIER 1: Presentation */}
          <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col items-center z-10">
            <div className="w-full bg-gradient-to-b from-[#1a1f26] to-[#111111] border border-white/10 rounded-xl p-5 text-center shadow-lg relative overflow-hidden group hover:border-[#ffe975]/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#ffe975]/50" />
              <div className="flex items-center justify-center gap-3 mb-2">
                <Monitor className="w-5 h-5 text-[#ffe975]" />
                <h3 className="font-bold text-zinc-100">Presentation Tier (Browser)</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Interactive UI (React/Tailwind)</p>
              <p className="text-xs text-zinc-400 font-mono mt-1">Recharts Render Engine</p>
            </div>
          </motion.div>

          {/* Connection 1 */}
          <motion.div variants={itemVariants} className="h-16 w-px bg-gradient-to-b from-white/20 to-[#3bf4ff]/50 relative flex items-center justify-center">
            <div className="absolute left-4 bg-black/80 px-2 py-1 border border-white/10 rounded text-[10px] font-mono text-[#3bf4ff] whitespace-nowrap">
              1. POST Budget Payload
            </div>
            <ArrowDown className="absolute -bottom-2 w-4 h-4 text-[#3bf4ff]" />
          </motion.div>

          {/* TIER 2: Application */}
          <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col items-center z-10">
            <div className="w-full bg-gradient-to-b from-[#1a1f26] to-[#111111] border border-white/10 rounded-xl p-5 text-center shadow-lg relative overflow-hidden group hover:border-[#3bf4ff]/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#3bf4ff]/50" />
              <div className="flex items-center justify-center gap-3 mb-2">
                <Server className="w-5 h-5 text-[#3bf4ff]" />
                <h3 className="font-bold text-zinc-100">Application Tier</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Next.js API Route: /api/simulate</p>
              <div className="mt-3 py-1.5 px-3 bg-black/50 border border-white/5 rounded-md text-xs font-mono text-zinc-300">
                child_process.exec (IPC Bridge)
              </div>
            </div>
          </motion.div>

          {/* Branching Connections */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl flex justify-between relative mt-2">
            {/* Left Branch */}
            <div className="w-1/2 h-16 border-l border-t border-white/20 rounded-tl-xl relative">
              <div className="absolute -left-12 top-4 bg-black/80 px-2 py-1 border border-white/10 rounded text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                2. fs.writeFile
              </div>
              <div className="absolute -left-20 top-12 bg-black/80 px-2 py-1 border border-white/10 rounded text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                6. fs.readFile & Parse
              </div>
              <ArrowDown className="absolute -left-2 -bottom-2 w-4 h-4 text-white/40" />
            </div>

            {/* Center Branch */}
            <div className="absolute left-1/2 -translate-x-1/2 h-24 w-px bg-gradient-to-b from-white/20 to-[#5df5a5]/50 flex items-center justify-center">
              <div className="absolute left-4 bg-black/80 px-2 py-1 border border-white/10 rounded text-[10px] font-mono text-[#5df5a5] whitespace-nowrap">
                3. Shell Execution
              </div>
              <ArrowDown className="absolute -bottom-2 w-4 h-4 text-[#5df5a5]" />
            </div>

            {/* Right Branch */}
            <div className="w-1/2 h-16 border-r border-t border-white/20 rounded-tr-xl relative">
              <ArrowDown className="absolute -right-2 -bottom-2 w-4 h-4 text-white/40" />
            </div>
          </motion.div>

          {/* Bottom Grid */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-6 z-10">
            
            {/* TIER 3: Core Engine */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="w-full bg-gradient-to-b from-[#1a1f26] to-[#111111] border border-white/10 rounded-xl p-5 text-center shadow-lg relative overflow-hidden group hover:border-[#5df5a5]/50 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#5df5a5]/50" />
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Cpu className="w-5 h-5 text-[#5df5a5]" />
                  <h3 className="font-bold text-zinc-100">Core Mathematics Engine (Offline)</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="py-2 px-3 bg-[#5df5a5]/10 border border-[#5df5a5]/20 rounded-md text-xs font-mono text-[#5df5a5]">
                    run.sh (Automated Entry Point)
                  </div>
                  <ArrowDown className="w-4 h-4 text-zinc-600 mx-auto" />
                  <div className="py-2 px-3 bg-[#5df5a5]/10 border border-[#5df5a5]/20 rounded-md text-xs font-mono text-[#5df5a5]">
                    predict.py (Core Logic)
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="py-2 px-2 bg-[#7b5ff0]/10 border border-[#7b5ff0]/20 rounded-md text-[10px] font-mono text-[#7b5ff0]">
                      heuristics.json (AI)
                    </div>
                    <div className="py-2 px-2 bg-[#7b5ff0]/10 border border-[#7b5ff0]/20 rounded-md text-[10px] font-mono text-[#7b5ff0]">
                      model.pkl (Weights)
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* TIER 4: Ephemeral Storage */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="w-full h-full bg-gradient-to-b from-[#1a1f26] to-[#111111] border border-white/10 rounded-xl p-5 text-center shadow-lg relative overflow-hidden group hover:border-white/30 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-500/50" />
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-zinc-400" />
                  <h3 className="font-bold text-zinc-100">Ephemeral Storage (IO)</h3>
                </div>
                
                <div className="flex flex-col gap-4 h-full justify-center mt-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-black/50 border border-white/5 rounded-lg">
                    <FileJson className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">temp_input.csv</span>
                    <span className="text-[10px] text-zinc-600">IN</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-black/50 border border-white/5 rounded-lg">
                    <FileJson className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">temp_output.csv</span>
                    <span className="text-[10px] text-zinc-600">OUT</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* --- DATA FLOW EXPLANATION SECTION --- */}
        <div className="max-w-4xl mx-auto w-full mb-20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
            <Activity className="w-5 h-5 text-[#7b5ff0]" />
            Request Lifecycle Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 1 to 3 */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-[#3bf4ff]/10 text-[#3bf4ff] flex items-center justify-center text-xs font-bold">1</span>
                  <h4 className="font-bold text-zinc-200">POST Budget Payload</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  The Interactive UI collects budget parameters and sends a structured JSON POST request to the Next.js application tier.
                </p>
              </div>

              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold">2</span>
                  <h4 className="font-bold text-zinc-200">fs.writeFile (Storage)</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  To avoid runtime payload limits, the API writes the payload into <code className="text-xs bg-black px-1 rounded text-[#5df5a5]">temp_input.csv</code> inside the secure ephemeral directory.
                </p>
              </div>

              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-[#5df5a5]/10 text-[#5df5a5] flex items-center justify-center text-xs font-bold">3</span>
                  <h4 className="font-bold text-zinc-200">Shell Execution (IPC)</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  Node.js triggers <code className="text-xs bg-black px-1 rounded text-[#5df5a5]">child_process.exec</code>, executing the offline <code className="text-xs bg-black px-1 rounded text-[#5df5a5]">run.sh</code> entry point to boot the Python environment.
                </p>
              </div>
            </div>

            {/* Step 4 to 7 */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-[#7b5ff0]/10 text-[#7b5ff0] flex items-center justify-center text-xs font-bold">4 & 5</span>
                  <h4 className="font-bold text-zinc-200">Core Engine Processing</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  <code className="text-xs bg-black px-1 rounded text-[#5df5a5]">predict.py</code> reads the input CSV, loads pre-trained weights (<code className="text-xs bg-black px-1 rounded text-[#7b5ff0]">model.pkl</code>), matches heuristics, and writes bounds to <code className="text-xs bg-black px-1 rounded text-[#5df5a5]">temp_output.csv</code>.
                </p>
              </div>

              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold">6</span>
                  <h4 className="font-bold text-zinc-200">fs.readFile & Parse</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  The Next.js API awaits the process exit code (0), safely reads the generated output CSV, and parses it back into a JavaScript object matrix.
                </p>
              </div>

              <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded bg-[#ffe975]/10 text-[#ffe975] flex items-center justify-center text-xs font-bold">7</span>
                  <h4 className="font-bold text-zinc-200">Returns JSON Array</h4>
                </div>
                <p className="text-sm text-zinc-400">
                  The API serves the formatted JSON array back to the Browser, triggering the React state update and rendering the Recharts graphics.
                </p>
              </div>
            </div>

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
            <span className="text-emerald-500/70">System Integrity: Verified</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <span>TEAM: SHIVADUTT • SHANI • VANSHIKA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}