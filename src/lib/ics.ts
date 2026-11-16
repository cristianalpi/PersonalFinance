// Calendar feed (iCalendar) with the upcoming payment dates, so any calendar
// app that subscribes to it shows them and can alert before each one.
import { addDays, dueDates, formatCOP } from "./finance.ts";

export interface DueItem {
  id: string;
  name: string;
  due_day: number;
  monthly_payment: number | null;
}

const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
const compact = (date: string) => date.replace(/-/g, "");

export function buildCalendar(items: DueItem[], today: string, monthsAhead = 3): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Finanzas//Pagos//ES", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Pagos"];
  for (const item of items) {
    for (const date of dueDates(item.due_day, today, monthsAhead)) {
      const summary = `Pagar ${item.name}${item.monthly_payment ? ` · cuota ${formatCOP(item.monthly_payment)}` : ""}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${item.id}-${date}@finanzas`,
        `DTSTAMP:${compact(today)}T000000Z`,
        `DTSTART;VALUE=DATE:${compact(date)}`,
        `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
        `SUMMARY:${escapeText(summary)}`,
        "TRANSP:TRANSPARENT",
        // Two days before at 9:00, and the same day at 8:00 (offsets from midnight).
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(summary)}`, "TRIGGER:-PT39H", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(summary)}`, "TRIGGER:PT8H", "END:VALARM",
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
