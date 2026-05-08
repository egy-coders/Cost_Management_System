import { useAuth } from "../hooks/useAuth";
import { Panel } from "../components/ui/Panel";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "../i18n";

export function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation(["settings", "common"]);
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold text-ink">{t("settings:title")}</h1><p className="text-sm text-gray-500">{t("settings:subtitle")}</p></div>
      <Panel title={t("settings:current_user")}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-gray-500">{t("common:fields.name")}</dt><dd>{user?.name}</dd></div>
          <div><dt className="font-semibold text-gray-500">{t("common:fields.email")}</dt><dd>{user?.email}</dd></div>
          <div><dt className="font-semibold text-gray-500">{t("common:fields.role")}</dt><dd>{user?.role ? t(`common:roles.${user.role}`) : ""}</dd></div>
          <div><dt className="font-semibold text-gray-500">{t("settings:preferred_language")}</dt><dd>{t(`common:language.${normalizeLanguage(user?.preferred_language) === "ar" ? "arabic" : "english"}`)}</dd></div>
          <div><dt className="font-semibold text-gray-500">{t("common:fields.api")}</dt><dd>{import.meta.env.VITE_API_BASE_URL || t("common:messages.same_origin_proxy")}</dd></div>
        </dl>
      </Panel>
    </div>
  );
}
