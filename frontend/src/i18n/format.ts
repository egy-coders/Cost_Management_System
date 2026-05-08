import i18n, { isRtlLanguage, normalizeLanguage } from "./index";

const localeMap = {
  en: "en-US",
  ar: "ar-EG"
} as const;

const moneyKeys = new Set([
  "amount",
  "amount_before_vat",
  "balance",
  "cash_balance",
  "cash_in",
  "cash_out",
  "paid",
  "paid_amount",
  "pending",
  "pending_amount",
  "project_cost_gap",
  "total",
  "total_amount",
  "total_cash_in",
  "total_cash_out",
  "total_paid",
  "total_pending",
  "unit_rate",
  "vat_amount"
]);

const dateKeys = new Set(["created_at", "date", "expense_date", "payment_date", "received_date", "updated_at"]);

export function currentLanguage() {
  return normalizeLanguage(i18n.resolvedLanguage || i18n.language);
}

export function currentLocale(language = currentLanguage()) {
  return localeMap[normalizeLanguage(language)];
}

function toNumber(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

export function formatNumber(value: string | number | undefined | null, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(currentLocale(), options).format(toNumber(value));
}

export function formatCurrency(value: string | number | undefined | null, currency = "SAR") {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat(currentLocale(), {
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency"
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  }
}

export function formatPercent(value: string | number | undefined | null) {
  return `${formatNumber(value, { maximumFractionDigits: 2 })}%`;
}

function parseDate(value: string | Date) {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  return new Date(value);
}

export function formatDate(value: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(currentLocale(), options || { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value: string | Date | undefined | null) {
  if (!value) return "";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(currentLocale(), {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatMonth(value: string | undefined | null) {
  if (!value) return "";
  const date = /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T00:00:00`) : parseDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(currentLocale(), { month: "short", year: "numeric" }).format(date);
}

export function humanizeEnum(value: string | undefined | null) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isMoneyKey(key: string) {
  return moneyKeys.has(key);
}

export function isDateKey(key: string) {
  return dateKeys.has(key) || key.endsWith("_date");
}

export function isCurrentRtl() {
  return isRtlLanguage(currentLanguage());
}
