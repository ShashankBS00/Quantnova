/**
 * Helper to determine reliable Indian Stock Exchange (NSE / BSE) Market Status.
 * Evaluates current time converted to Indian Standard Time (IST, UTC+5:30)
 * rather than assuming based solely on user's arbitrary client locale time.
 */

// Official NSE trading holidays (major fixed dates for reference)
const FIXED_HOLIDAYS = [
  "01-26", // Republic Day
  "08-15", // Independence Day
  "10-02", // Gandhi Jayanti
  "12-25", // Christmas
];

export function getNSEMarketStatus() {
  const now = new Date();

  // Convert to IST (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 5.5 * 3600000);

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const mm = String(istTime.getMonth() + 1).padStart(2, "0");
  const dd = String(istTime.getDate()).padStart(2, "0");
  const dateKey = `${mm}-${dd}`;

  const isWeekend = day === 0 || day === 6;
  const isHoliday = FIXED_HOLIDAYS.includes(dateKey);

  // Pre-open session: 09:00 to 09:15 IST (540 to 555)
  // Regular session: 09:15 to 15:30 IST (555 to 930)
  const isPreOpen = !isWeekend && !isHoliday && timeInMinutes >= 540 && timeInMinutes < 555;
  const isRegularOpen = !isWeekend && !isHoliday && timeInMinutes >= 555 && timeInMinutes <= 930;

  if (isRegularOpen) {
    return {
      status: "OPEN",
      label: "NSE Open",
      badgeColor: "emerald",
      detail: "Regular Trading Session · Closes at 03:30 PM IST",
      isTrading: true,
      timeIST: istTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST",
    };
  }

  if (isPreOpen) {
    return {
      status: "PRE_OPEN",
      label: "NSE Pre-Open",
      badgeColor: "amber",
      detail: "Pre-Market Discovery · Regular opens at 09:15 AM IST",
      isTrading: false,
      timeIST: istTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST",
    };
  }

  return {
    status: "CLOSED",
    label: "NSE Closed",
    badgeColor: "slate",
    detail: isWeekend
      ? "Weekend · Market opens Monday at 09:15 AM IST"
      : isHoliday
      ? "Trading Holiday · Market closed"
      : timeInMinutes > 930
      ? "Market Closed · Next session tomorrow at 09:15 AM IST"
      : "Market Closed · Opens today at 09:15 AM IST",
    isTrading: false,
    timeIST: istTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST",
  };
}
