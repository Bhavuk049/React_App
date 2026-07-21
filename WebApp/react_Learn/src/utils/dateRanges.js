// India's financial year runs April 1 – March 31, so "quarter"/"year" here follow that,
// not the calendar year — standard for GST-driven sales reporting.

export const DATE_RANGE_PRESETS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This week" },
  { value: "lastWeek", label: "Last week" },
  { value: "thisQuarter", label: "This quarter" },
  { value: "prevQuarter", label: "Previous quarter" },
  { value: "thisYear", label: "This year" },
  { value: "prevFinancialYear", label: "Previous financial year" },
  { value: "custom", label: "Other (custom range)" },
];

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function financialYearStart(date) {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1
}

function endOfFinancialYear(fyStart) {
  return new Date(fyStart.getFullYear() + 1, 3, 0); // day before the next April 1 = March 31
}

function financialQuarterStart(date) {
  const fyStart = financialYearStart(date);
  const monthsIn = (date.getFullYear() - fyStart.getFullYear()) * 12 + (date.getMonth() - fyStart.getMonth());
  const quarterIndex = Math.floor(monthsIn / 3);
  return new Date(fyStart.getFullYear(), fyStart.getMonth() + quarterIndex * 3, 1);
}

export function getPresetDateRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { startDate: toDateString(today), endDate: toDateString(today) };

    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { startDate: toDateString(y), endDate: toDateString(y) };
    }

    case "thisWeek": {
      const start = startOfWeek(today);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    case "lastWeek": {
      const start = startOfWeek(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    case "thisQuarter": {
      const start = financialQuarterStart(today);
      const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    case "prevQuarter": {
      const thisStart = financialQuarterStart(today);
      const start = new Date(thisStart.getFullYear(), thisStart.getMonth() - 3, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    case "thisYear": {
      const start = financialYearStart(today);
      const end = endOfFinancialYear(start);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    case "prevFinancialYear": {
      const thisStart = financialYearStart(today);
      const start = new Date(thisStart.getFullYear() - 1, 3, 1);
      const end = endOfFinancialYear(start);
      return { startDate: toDateString(start), endDate: toDateString(end) };
    }

    default:
      return { startDate: "", endDate: "" };
  }
}
