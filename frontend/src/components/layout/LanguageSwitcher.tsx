import clsx from "clsx";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { normalizeLanguage, supportedLanguages, type SupportedLanguage } from "../../i18n";
import { useAuth } from "../../hooks/useAuth";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");
  const { user, updatePreferredLanguage } = useAuth();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  async function changeLanguage(language: SupportedLanguage) {
    if (language === activeLanguage) return;
    await i18n.changeLanguage(language);
    if (user) {
      updatePreferredLanguage(language).catch(() => undefined);
    }
  }

  return (
    <div className="inline-flex min-h-10 items-center gap-1 rounded-md border border-gray-200 bg-white px-1" aria-label={t("language.select")}>
      <Languages size={16} className="mx-2 text-gray-500" />
      {supportedLanguages.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => changeLanguage(language.code)}
          className={clsx(
            "rounded px-2.5 py-1.5 text-xs font-bold transition",
            activeLanguage === language.code ? "bg-teal-50 text-site" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          )}
          lang={language.code}
        >
          {t(language.shortKey)}
        </button>
      ))}
    </div>
  );
}
