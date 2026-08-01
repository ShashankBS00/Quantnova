import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-900">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>

      </div>

    </div>
  );
}