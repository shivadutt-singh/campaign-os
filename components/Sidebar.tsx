"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Sliders,
  History,
  GitCompare,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pathname === "/") return null;

  const coreNav = [
    { label: "Overview", href: "/overview", icon: LayoutDashboard },
    { label: "Simulator", href: "/simulator", icon: Sliders },
    { label: "History", href: "/dashboard", icon: History },
  ];

  const intelligenceNav = [
    { label: "Scenario Matrix", href: "/matrix", icon: GitCompare },
    { label: "Client Reports", href: "/reports", icon: FileText },
    { label: "Risk Analysis", href: "/risk", icon: AlertTriangle },
  ];

  const renderNavItems = (items: typeof coreNav) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative ${
            isActive
              ? "bg-white/[0.08] text-white font-medium shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <Icon
            className={`w-4.5 h-4.5 transition-colors duration-200 flex-shrink-0 ${
              isActive ? "text-[#3bf4ff]" : "text-neutral-500 group-hover:text-neutral-300"
            }`}
          />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
          
          {/* Tooltip on Collapsed Hover */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-neutral-900 border border-white/10 text-white text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-xl">
              {item.label}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-screen flex-shrink-0 flex flex-col border-r border-white/10 bg-neutral-950 z-30 select-none overflow-hidden print:hidden"
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-white/10 justify-between ${isCollapsed ? "px-4" : "px-5"} overflow-hidden`}>
        <Link 
          href="/" 
          className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
        >
          <div className="w-6 h-6 rounded bg-[#7b5ff0] flex items-center justify-center font-bold text-black text-xs flex-shrink-0 animate-scaleIn">
            C
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-white tracking-tight text-sm whitespace-nowrap overflow-hidden"
              >
                CampaignOS
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center flex-shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto overflow-x-hidden">
        {/* Core section */}
        <div>
          {!isCollapsed ? (
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-3">
              Core
            </div>
          ) : (
            <div className="border-b border-white/5 my-3 mx-2" />
          )}
          <nav className="space-y-1">{renderNavItems(coreNav)}</nav>
        </div>

        {/* Intelligence section */}
        <div>
          {!isCollapsed ? (
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-3">
              Intelligence
            </div>
          ) : (
            <div className="border-b border-white/5 my-3 mx-2" />
          )}
          <nav className="space-y-1">{renderNavItems(intelligenceNav)}</nav>
        </div>
      </div>

      {/* User Session Bottom Profile */}
      <div className="p-4 border-t border-white/10 mt-auto flex flex-col gap-3">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5df5a5] to-[#3bf4ff] p-[1px] flex-shrink-0">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold text-white font-mono">
                US
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-white whitespace-nowrap">User Session</span>
                <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM_ONLINE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
