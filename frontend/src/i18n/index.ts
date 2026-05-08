import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import arAuth from "./locales/ar/auth.json";
import arCashIn from "./locales/ar/cashIn.json";
import arCategories from "./locales/ar/categories.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arExpenses from "./locales/ar/expenses.json";
import arPayments from "./locales/ar/payments.json";
import arProjects from "./locales/ar/projects.json";
import arReports from "./locales/ar/reports.json";
import arSettings from "./locales/ar/settings.json";
import arUsers from "./locales/ar/users.json";
import arValidation from "./locales/ar/validation.json";
import arVendors from "./locales/ar/vendors.json";
import enAuth from "./locales/en/auth.json";
import enCashIn from "./locales/en/cashIn.json";
import enCategories from "./locales/en/categories.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enExpenses from "./locales/en/expenses.json";
import enPayments from "./locales/en/payments.json";
import enProjects from "./locales/en/projects.json";
import enReports from "./locales/en/reports.json";
import enSettings from "./locales/en/settings.json";
import enUsers from "./locales/en/users.json";
import enValidation from "./locales/en/validation.json";
import enVendors from "./locales/en/vendors.json";

export const LANGUAGE_STORAGE_KEY = "preferredLanguage";

export const supportedLanguages = [
  { code: "en", labelKey: "language.english", shortKey: "language.en_short", dir: "ltr" },
  { code: "ar", labelKey: "language.arabic", shortKey: "language.ar_short", dir: "rtl" }
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

const namespaces = [
  "common",
  "auth",
  "dashboard",
  "projects",
  "expenses",
  "payments",
  "cashIn",
  "vendors",
  "categories",
  "users",
  "settings",
  "reports",
  "validation"
];

const resources = {
  en: {
    auth: enAuth,
    cashIn: enCashIn,
    categories: enCategories,
    common: enCommon,
    dashboard: enDashboard,
    expenses: enExpenses,
    payments: enPayments,
    projects: enProjects,
    reports: enReports,
    settings: enSettings,
    users: enUsers,
    validation: enValidation,
    vendors: enVendors
  },
  ar: {
    auth: arAuth,
    cashIn: arCashIn,
    categories: arCategories,
    common: arCommon,
    dashboard: arDashboard,
    expenses: arExpenses,
    payments: arPayments,
    projects: arProjects,
    reports: arReports,
    settings: arSettings,
    users: arUsers,
    validation: arValidation,
    vendors: arVendors
  }
};

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const code = (language || "").toLowerCase();
  if (code.startsWith("ar")) return "ar";
  return "en";
}

export function isRtlLanguage(language?: string | null) {
  return normalizeLanguage(language) === "ar";
}

function applyDocumentLanguage(language?: string | null) {
  const normalized = normalizeLanguage(language);
  document.documentElement.lang = normalized;
  document.documentElement.dir = isRtlLanguage(normalized) ? "rtl" : "ltr";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: namespaces,
    defaultNS: "common",
    fallbackNS: "common",
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    },
    returnNull: false
  });

i18n.on("languageChanged", applyDocumentLanguage);
applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);

export default i18n;
