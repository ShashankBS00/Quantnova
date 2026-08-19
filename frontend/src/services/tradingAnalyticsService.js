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

  return {
    totalTrades,
    buyOrders,
    sellOrders,
    orders,
  };
}