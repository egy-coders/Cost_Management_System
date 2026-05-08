import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, formatMoney, queryString, rows } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import { formatDate, formatMonth, formatNumber, formatPercent, humanizeEnum, isDateKey, isMoneyKey } from "../i18n/format";
import type { Category, Project, Vendor } from "../types";

const reportOptions = ["project-summary", "monthly-cost", "category-cost", "vendor-statement", "pending-payments", "cash-flow"];

export function ReportsPage() {
  const { t } = useTranslation(["reports", "common"]);
  const [report, setReport] = useState("project-summary");
  const [filters, setFilters] = useState({ project: "", month: "", date_from: "", date_to: "", category: "", vendor: "" });
  const qs = useMemo(() => queryString(filters), [filters]);
  const data = useQuery({
    queryKey: ["report", report, qs],
    queryFn: async () => (await api.get(`/reports/${report}/?${qs}`)).data
  });
  const projects = useQuery({ queryKey: ["projects"], queryFn: async () => rows<Project>((await api.get("/projects/")).data) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => rows<Category>((await api.get("/categories/")).data) });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: async () => rows<Vendor>((await api.get("/vendors/")).data) });
  const rowsData = Array.isArray(data.data) ? data.data : [];
  const flatRows = rowsData.map((row: Record<string, unknown>) => {
    const output: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      output[key] = Array.isArray(value) ? t("common:messages.rows_count", { count: value.length }) : value;
    });
    return output;
  });
  const headers = flatRows[0] ? Object.keys(flatRows[0]).slice(0, 8) : [];
  const exportQs = queryString({ ...filters, report });

  async function download(format: "excel" | "pdf") {
    const response = await api.get(`/reports/export/${format}/?${exportQs}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report}.${format === "excel" ? "xlsx" : "pdf"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-ink">{t("reports:title")}</h1><p className="text-sm text-gray-500">{t("reports:subtitle")}</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => download("excel")}><Download size={18} />{t("common:actions.excel")}</Button>
          <Button variant="secondary" onClick={() => download("pdf")}><Download size={18} />{t("common:actions.pdf")}</Button>
        </div>
      </div>
      <Panel title={t("reports:filters")}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label={t("common:fields.report")}>
            <Select value={report} onChange={(e) => setReport(e.target.value)}>
              {reportOptions.map((value) => <option key={value} value={value}>{t(`reports:options.${value}`)}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.project")}><Select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}><option value="">{t("common:messages.all")}</option>{(projects.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label={t("common:fields.month")}><Input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} /></Field>
          <Field label={t("common:fields.date_from")}><Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} /></Field>
          <Field label={t("common:fields.date_to")}><Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} /></Field>
          <Field label={t("common:fields.category")}><Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">{t("common:messages.all")}</option>{(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label={t("common:fields.vendor")}><Select value={filters.vendor} onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}><option value="">{t("common:messages.all")}</option>{(vendors.data || []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
        </div>
      </Panel>
      <Panel title={t(`reports:options.${report}`)}>
        {data.isLoading ? <LoadingState /> : flatRows.length ? (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{t(`reports:headers.${header}`, { defaultValue: humanizeEnum(header) })}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {flatRows.map((row: Record<string, unknown>, index: number) => (
                  <tr key={index}>{headers.map((header) => <td key={header} className="px-4 py-3">{renderValue(header, row[header], t)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}

function renderValue(key: string, value: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  if (key === "month" && typeof value === "string") return formatMonth(value);
  if (key === "percentage_of_total_cost") return formatPercent(value as string | number);
  if (isDateKey(key) && typeof value === "string") return formatDate(value);
  if (isMoneyKey(key)) return formatMoney(value as string | number);
  if (["approval_status", "payment_status", "status"].includes(key) && typeof value === "string") return t(`common:statuses.${value}`, { defaultValue: humanizeEnum(value) });
  if (typeof value === "number") return Number.isInteger(value) ? formatNumber(value) : formatNumber(value, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return String(value ?? "");
}
