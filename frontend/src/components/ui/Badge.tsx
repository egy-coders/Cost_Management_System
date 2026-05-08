import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { humanizeEnum } from "../../i18n/format";

const styles: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 border-amber-200",
  UNPAID: "bg-red-100 text-red-800 border-red-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ON_HOLD: "bg-amber-100 text-amber-800 border-amber-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200"
};

export function Badge({ value }: { value: string }) {
  const { t } = useTranslation("common");
  return (
    <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", styles[value] || "bg-gray-100 text-gray-700 border-gray-200")}>
      {t([`statuses.${value}`, `roles.${value}`], { defaultValue: humanizeEnum(value) })}
    </span>
  );
}
