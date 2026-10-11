import { getTradingAccount } from "@/services/tradingService";

export async function getPortfolioHoldings() {
  const account = await getTradingAccount();

  return Object.entries(account.holdings || {}).map(
    ([symbol, holding]) => ({
      symbol,
      quantity: holding.quantity,
      averagePrice: holding.average_price,
    })
  );
}

export async function getPortfolioAccountData() {
  const account = await getTradingAccount();
  const holdings = Object.entries(account.holdings || {}).map(
    ([symbol, holding]) => ({
      symbol,
      quantity: holding.quantity,
      averagePrice: holding.average_price,
    })
  );

  return {
    account,
    holdings,
    orders: account.orders || [],
    cash: Number(account.cash || 0),
    initialCash: Number(account.initial_cash || 100000),
    realizedPnl: Number(account.realized_pnl || 0),
    winningTrades: account.winning_trades || 0,
    losingTrades: account.losing_trades || 0,
  };
}