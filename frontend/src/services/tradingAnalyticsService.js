import { getTradingAccount } from "@/services/tradingService";

export async function getTradingAnalytics() {
  const account = await getTradingAccount();

  const orders = account.orders || [];

  const totalTrades = orders.length;

  const buyOrders = orders.filter(
    (order) => order.side === "BUY"
  ).length;

  const sellOrders = orders.filter(
    (order) => order.side === "SELL"
  ).length;

  const winningTrades =
    account.winning_trades || 0;

  const losingTrades =
    account.losing_trades || 0;

  const completedTrades =
    winningTrades + losingTrades;

  const winRate =
    completedTrades > 0
      ? (winningTrades / completedTrades) * 100
      : 0;

  // The account endpoint returns order fills, not a historical equity field.
  // Rebuild equity in chronological order: a BUY exchanges cash for an asset at
  // cost (no immediate equity change), while a SELL realizes the order P&L.
  const initialCash = Number(account.initial_cash ?? 100000);
  let cumulativePnl = 0;

  const equityHistory = [...orders]
    .reverse()
    .map((order, index) => {
      const pnl = Number(order.realized_pnl || 0);
      cumulativePnl += pnl;

      return {
        trade: index + 1,
        symbol: order.symbol,
        side: order.side,
        equity: initialCash + cumulativePnl,
        pnl,
      };
    });

  return {
    totalTrades,
    buyOrders,
    sellOrders,
    winningTrades,
    losingTrades,
    winRate,
    realizedPnl: account.realized_pnl || 0,
    bestTrade: account.best_trade,
    worstTrade: account.worst_trade,
    initialCash,
    equityHistory,
    orders,
  };
}
