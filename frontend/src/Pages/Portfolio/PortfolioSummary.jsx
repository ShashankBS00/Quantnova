export default function PortfolioSummary({
  holdings,
  marketData,
  loading,
}) {
  // Total amount invested
  const totalInvestment = holdings.reduce(
    (total, stock) =>
      total + stock.quantity * stock.averagePrice,
    0
  );

  // Current market value
  const currentValue = holdings.reduce(
    (total, stock) => {
      const data = marketData[stock.symbol];

      if (
        !data ||
        typeof data.currentPrice !== "number"
      ) {
        return total;
      }

      return (
        total +
        stock.quantity * data.currentPrice
      );
    },
    0
  );

  // Overall P&L
  const overallPnl =
    currentValue - totalInvestment;

  const overallPnlPercent =
    totalInvestment > 0
      ? (overallPnl / totalInvestment) * 100
      : 0;

  // Today's P&L
  const todayPnl = holdings.reduce(
    (total, stock) => {
      const data = marketData[stock.symbol];

      if (
        !data ||
        typeof data.currentPrice !== "number" ||
        typeof data.previousClose !== "number"
      ) {
        return total;
      }

      return (
        total +
        (data.currentPrice -
          data.previousClose) *
          stock.quantity
      );
    },
    0
  );

  // Today's P&L %
  const todayInvestment =
    currentValue - todayPnl;

  const todayPnlPercent =
    todayInvestment > 0
      ? (todayPnl / todayInvestment) * 100
      : 0;

  const formatMoney = (value) =>
    `₹${Math.abs(value).toFixed(2)}`;

  const formatPnl = (value) =>
    `${value >= 0 ? "+" : "-"}₹${Math.abs(
      value
    ).toFixed(2)}`;

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
        : formatPnl(todayPnl),
      change: loading
        ? "Loading..."
        : `${
            todayPnlPercent >= 0 ? "+" : ""
          }${todayPnlPercent.toFixed(2)}%`,
      color:
        todayPnl >= 0
          ? "text-green-400"
          : "text-red-400",
    },
    {
      title: "Overall P&L",
      value: loading
        ? "Loading..."
        : formatPnl(overallPnl),
      change: loading
        ? "Loading..."
        : `${
            overallPnlPercent >= 0 ? "+" : ""
          }${overallPnlPercent.toFixed(2)}%`,
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