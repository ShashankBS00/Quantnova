import React, { useState } from "react";
import { 
  FileText, 
  Calendar, 
  Filter, 
  CheckCircle2
} from "lucide-react";

const REPORTS_DATA = [
  {
    id: "REP-2026-0903",
    title: "Daily EOD Execution & P&L Summary",
    date: "Sep 03, 2026",
    type: "Daily Performance",
    status: "Finalized",
    tradesCount: 14,
    netPnL: "+₹2,340.00",
    isProfit: true,
    fileSize: "142 KB"
  },
  {
    id: "REP-2026-0902",
    title: "Mean-Reversion Algo Backtest Audit",
    date: "Sep 02, 2026",
    type: "Strategy Backtest",
    status: "Generated",
    tradesCount: 48,
    netPnL: "+₹12,450.00",
    isProfit: true,
    fileSize: "512 KB"
  },
  {
    id: "REP-2026-0901",
    title: "Monthly Risk & Drawdown Stress Test",
    date: "Sep 01, 2026",
    type: "Risk Analytics",
    status: "Finalized",
    tradesCount: 184,
    netPnL: "-₹3,120.00",
    isProfit: false,
    fileSize: "1.2 MB"
  },
  {
    id: "REP-2026-0828",
    title: "Slippage & Fill Latency Telemetry",
    date: "Aug 28, 2026",
    type: "Execution Quality",
    status: "Finalized",
    tradesCount: 92,
    netPnL: "+₹5,810.00",
    isProfit: true,
    fileSize: "320 KB"
  }
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState("ALL");

  const filteredReports = selectedType === "ALL" 
    ? REPORTS_DATA 
    : REPORTS_DATA.filter(r => r.type.toLowerCase().includes(selectedType.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12 select-none">
      
      {/* 1. Header Banner */}
      <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <FileText size={14} /> Audit & Ledger
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Performance Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Export tax ledgers, backtest telemetry logs, and institutional execution quality reports.
          </p>
        </div>

      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#12141a] border border-[#1f232d] shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            TOTAL REALIZED GAIN
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-400 font-mono">+₹17,480.00</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">Selected session cycle</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12141a] border border-[#1f232d] shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            EST. CHARGES & STT
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-200 font-mono">₹412.50</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">Brokerage, exchange fees</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12141a] border border-[#1f232d] shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            SHARPE ESTIMATE
          </p>
          <h2 className="mt-2 text-2xl font-bold text-amber-400 font-mono">1.92</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">Benchmarked vs NIFTY</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12141a] border border-[#1f232d] shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            MAX PEAK DRAWDOWN
          </p>
          <h2 className="mt-2 text-2xl font-bold text-rose-400 font-mono">-2.4%</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">Within 5% safety limit</p>
        </div>
      </div>

      {/* 3. Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141a] border border-[#1f232d] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-amber-400 ml-2" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase mr-2">Type:</span>
          {["ALL", "Daily", "Backtest", "Risk"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedType === type
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "text-slate-400 hover:text-white hover:bg-[#1a1d26]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mr-2">
          <Calendar size={13} className="text-slate-500" />
          <span>Showing latest 30-day logs</span>
        </div>
      </div>

      {/* 4. Reports Table */}
      <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f232d] bg-[#0a0b0e]/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Report Identifier</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Fills</th>
                <th className="py-3.5 px-4 text-right">Net Return</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f232d] text-xs font-mono">
              {filteredReports.map((report) => (
                <tr 
                  key={report.id}
                  className="hover:bg-[#1a1d26]/60 transition-colors group"
                >
                  {/* ID & Title */}
                  <td className="py-4 px-5">
                    <div className="font-bold text-white tracking-wide font-mono text-sm">
                      {report.id}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {report.title}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4 text-slate-300">
                    <span className="px-2.5 py-1 rounded-md bg-[#0a0b0e] border border-[#1f232d] text-[11px]">
                      {report.type}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 text-slate-400">
                    {report.date}
                  </td>

                  {/* Fills */}
                  <td className="py-4 px-4 text-center text-slate-200">
                    {report.tradesCount} orders
                  </td>

                  {/* P&L */}
                  <td className="py-4 px-4 text-right font-bold">
                    <span className={report.isProfit ? "text-emerald-400" : "text-rose-400"}>
                      {report.netPnL}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                      <CheckCircle2 size={11} /> {report.status}
                    </span>
                  </td>


                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}