import { getTradingAccount } from "@/services/tradingService";

export async function getPortfolioHoldings() {
  const account = await getTradingAccount();

  return Object.entries(account.holdings).map(
    ([symbol, holding]) => ({
      symbol,
      quantity: holding.quantity,
      averagePrice: holding.average_price,
    })
  );
}