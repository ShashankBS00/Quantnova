export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}