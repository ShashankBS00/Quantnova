import { holdings } from "@/data/portfolioData";

export default function PortfolioSummary({ marketData, loading }) {
  const totalInvestment = holdings.reduce(
    (total, stock) =>
      total + stock.quantity * stock.averagePrice,
    0
  );

  const currentValue = holdings.reduce(
    (total, stock) => {
      const data = marketData[stock.symbol];

      if (!data) return total;

      return total + stock.quantity * data.currentPrice;
    },
    0
  );

  const overallPnl = currentValue - totalInvestment;

  const overallPnlPercent =
    totalInvestment > 0
      ? (overallPnl / totalInvestment) * 100
      : 0;

  const todayPnl = holdings.reduce(
    (total, stock) => {
      const data = marketData[stock.symbol];

      if (!data) return total;

      return (
        total +
        (data.currentPrice - data.previousClose) *
          stock.quantity
      );
    },
    0
  );

  const todayPnlPercent =
    currentValue - todayPnl > 0
      ? (todayPnl / (currentValue - todayPnl)) * 100
      : 0;

  const summary = [
    {
      title: "Total Investment",
      value: `₹${totalInvestment.toFixed(2)}`,
      change: "Invested amount",
      color: "text-white",
    },
    {
      title: "Current Value",
      value: loading
        ? "Loading..."
        : `₹${currentValue.toFixed(2)}`,
      change: "Current market value",
      color: "text-white",
    },
    {
      title: "Today's P&L",
      value: loading
        ? "Loading..."
        : `${todayPnl >= 0 ? "+" : "-"}₹${Math.abs(
            todayPnl
          ).toFixed(2)}`,
      change: loading
        ? "Loading..."
        : `${todayPnlPercent >= 0 ? "+" : ""}${todayPnlPercent.toFixed(2)}%`,
      color:
        todayPnl >= 0
          ? "text-green-400"
          : "text-red-400",
    },
    {
      title: "Overall P&L",
      value: loading
        ? "Loading..."
        : `${overallPnl >= 0 ? "+" : "-"}₹${Math.abs(
            overallPnl
          ).toFixed(2)}`,
      change: loading
        ? "Loading..."
        : `${overallPnlPercent >= 0 ? "+" : ""}${overallPnlPercent.toFixed(2)}%`,
      color:
        overallPnl >= 0
          ? "text-green-400"
          : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {summary.map((item) => (
        <div
          key={item.title}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <p className="text-sm text-slate-400">
            {item.title}
          </p>

          <h2
            className={`text-2xl font-bold mt-3 ${item.color}`}
          >
            {item.value}
          </h2>

          <p className="text-sm text-slate-400 mt-2">
            {item.change}
          </p>
        </div>
      ))}
    </div>
  );
}