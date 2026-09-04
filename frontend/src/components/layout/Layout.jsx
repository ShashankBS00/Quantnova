import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden text-slate-100 select-none"
      style={{ background: 'var(--qn-bg)' }}>
      {/* 1. Full-Width Top Navigation + Ticker Ribbon */}
      <Navbar />

      {/* 2. Bottom Section: Sidebar on Left, Content on Right */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto overflow-x-hidden scrollbar-none"
          style={{ background: 'transparent' }}>
          {children}
        </main>
      </div>
    </div>
  );
}