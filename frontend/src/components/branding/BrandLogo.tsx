import clsx from "clsx";
import { useTranslation } from "react-i18next";

const logoSrc = "/brand/rak-logo.png";
const iconSrc = "/brand/rak-icon.png";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export function BrandLogo({ compact = false, className, imageClassName, textClassName }: BrandLogoProps) {
  const { t } = useTranslation("common");

  return (
    <div className={clsx("flex min-w-0 items-center gap-3", compact && "justify-center", className)}>
      <img
        src={compact ? iconSrc : logoSrc}
        alt={t("app.full_name")}
        className={clsx("h-11 w-11 shrink-0 object-contain", imageClassName)}
      />
      {!compact && (
        <div className={clsx("min-w-0", textClassName)}>
          <div className="truncate text-sm font-bold uppercase text-site">{t("app.short_name")}</div>
          <div className="truncate text-xs text-gray-500">{t("app.full_name")}</div>
        </div>
      )}
    </div>
  );
}
