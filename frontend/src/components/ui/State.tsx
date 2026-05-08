import { useTranslation } from "react-i18next";
import { BrandLogo } from "../branding/BrandLogo";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-red-100 bg-white p-8 text-center text-sm text-gray-500">
      <div className="relative grid h-14 w-14 place-items-center">
        <div className="absolute inset-0 rounded-full border-2 border-red-100 border-t-site motion-safe:animate-spin" />
        <BrandLogo compact imageClassName="h-8 w-8" />
      </div>
      <span>{label || t("states.loading")}</span>
    </div>
  );
}

export function EmptyState({ label }: { label?: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
      <BrandLogo compact imageClassName="h-10 w-10 opacity-60 grayscale" />
      <span>{label || t("states.empty")}</span>
    </div>
  );
}
