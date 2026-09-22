import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div 
      className="relative flex flex-col h-screen w-screen overflow-hidden text-slate-800 dark:text-slate-100 select-none transition-colors duration-300 ease-out"
      style={{ background: 'var(--qn-bg, radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.03), transparent 50%))' }}
    >
      {/* Visual Enhancements: High-end ambient background mesh glow wrappers */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-100 transition-opacity duration-300">
        {/* Top Right Indigo Ambient Light */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px]" />
        {/* Bottom Left Cyan Ambient Light */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 dark:bg-cyan-600/5 blur-[120px]" />
      </div>

      {/* 1. Full-Width Top Navigation + Ticker Ribbon */}
      <div className="relative z-20 border-b border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-[#090D16]/70 backdrop-blur-md">
        <Navbar />
      </div>

      {/* 2. Bottom Section: Sidebar on Left, Content on Right */}
      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar with structural divider line */}
        <div className="border-r border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-[#090D16]/40 backdrop-blur-md">
          <Sidebar />
        </div>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto overflow-x-hidden scrollbar-none bg-transparent">
          {/* Internal card wrapper to cleanly separate the dashboard view */}
          <div className="min-h-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
