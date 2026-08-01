import { Bell, Search, Moon, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">

      {/* Left */}

      <div>
        <h2 className="text-2xl font-bold text-white">
          Dashboard
        </h2>

        <p className="text-sm text-slate-400">
          Welcome to QuantNova
        </p>
      </div>

      {/* Center */}

      <div className="relative w-[420px]">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          type="text"
          placeholder="Search stocks..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        <button className="relative p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition">
          <Bell size={20} className="text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        <button className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition">
          <Moon size={20} className="text-white" />
        </button>

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl">

          <UserCircle size={38} className="text-blue-500" />

          <div>
            <h4 className="text-white font-semibold">
              Shashank
            </h4>

            <p className="text-xs text-slate-400">
              MCA Student
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}