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

  const equityHistory = orders.map(
    (order, index) => ({
      trade: index + 1,
      symbol: order.symbol,
      side: order.side,
      equity: Number(order.equity),
      pnl: Number(order.realized_pnl || 0),
    })
  );

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
    equityHistory,
    orders,
  };
}