import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { api, formatMoney, queryString, rows } from "../api/client";
import { BrandLogo } from "../components/branding/BrandLogo";
import { Field, Input, Select } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { LoadingState } from "../components/ui/State";
import { formatMonth, formatNumber } from "../i18n/format";
import type { Project } from "../types";

const COLORS = ["#a30f17", "#64748b", "#b45309", "#2563eb", "#16a34a", "#991b1b"];

function numericRows<T extends Record<string, unknown>>(data: T[], keys: string[]) {
  return data.map((row) => {
    const copy: Record<string, unknown> = { ...row };
    keys.forEach((key) => {
      copy[key] = Number(copy[key] || 0);
    });
    return copy;
  });
}

export function DashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const [project, setProject] = useState("");
  const [month, setMonth] = useState("");
  const filters = useMemo(() => queryString({ project, month }), [project, month]);

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => rows((await api.get("/projects/")).data)
  });
  const overview = useQuery({
    queryKey: ["dashboard", filters],
    queryFn: async () => (await api.get(`/dashboard/overview/?${filters}`)).data
  });
  const monthly = useQuery({
    queryKey: ["monthly-costs", filters],
    queryFn: async () => numericRows((await api.get(`/dashboard/monthly-costs/?${filters}`)).data, ["cash_in", "cash_out", "paid", "pending"])
  });
  const categories = useQuery({
    queryKey: ["category-costs", filters],
    queryFn: async () => numericRows((await api.get(`/dashboard/category-costs/?${filters}`)).data, ["total", "paid"])
  });
  const vendors = useQuery({
    queryKey: ["top-vendors", filters],
    queryFn: async () => numericRows((await api.get(`/dashboard/top-vendors/?${filters}`)).data, ["total", "paid", "pending"])
  });
  const paidPending = useQuery({
    queryKey: ["paid-vs-pending", filters],
    queryFn: async () => numericRows((await api.get(`/dashboard/paid-vs-pending/?${filters}`)).data, ["value"])
  });

  if (overview.isLoading) return <LoadingState />;

  const kpis = [
    { label: t("dashboard:kpis.total_cash_in"), value: overview.data?.total_cash_in, money: true },
    { label: t("dashboard:kpis.total_cash_out"), value: overview.data?.total_cash_out, money: true },
    { label: t("dashboard:kpis.total_paid"), value: overview.data?.total_paid, money: true },
    { label: t("dashboard:kpis.total_pending"), value: overview.data?.total_pending, money: true },
    { label: t("dashboard:kpis.cash_balance"), value: overview.data?.cash_balance, money: true },
    { label: t("dashboard:kpis.project_cost_gap"), value: overview.data?.project_cost_gap, money: true },
    { label: t("dashboard:kpis.expenses"), value: overview.data?.number_of_expenses },
    { label: t("dashboard:kpis.submitted"), value: overview.data?.number_of_pending_expenses },
    { label: t("dashboard:kpis.approved"), value: overview.data?.number_of_approved_expenses },
    { label: t("dashboard:kpis.rejected"), value: overview.data?.number_of_rejected_expenses }
  ];
  const paidPendingData = ((paidPending.data || []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    name: row.name === "Paid" ? t("common:fields.paid") : t("common:fields.pending")
  }));
  const approvalStatusData = ((overview.data?.approval_status || []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    approval_status_label: t(`common:statuses.${row.approval_status}`, { defaultValue: String(row.approval_status || "") })
  }));
  const paymentStatusData = ((overview.data?.payment_status || []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    payment_status_label: t(`common:statuses.${row.payment_status}`, { defaultValue: String(row.payment_status || "") })
  }));
  const tooltipFormatter = (value: unknown, name: string) => [
    ["count", "expense_count"].includes(name) ? formatNumber(value as number) : formatMoney(value as string | number),
    t(`common:fields.${name}`, { defaultValue: name.replaceAll("_", " ") })
  ];

  return (
    <div className="grid gap-5">
      <div className="relative overflow-hidden rounded-lg border border-red-100 bg-white px-5 py-5 shadow-sm">
        <div className="absolute inset-y-0 end-6 hidden opacity-[0.06] sm:block">
          <img src="/brand/rak-logo.png" alt="" className="h-full w-48 object-contain" aria-hidden="true" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3">
            <BrandLogo imageClassName="h-12 w-12" textClassName="[&_div:first-child]:text-xs" />
          </div>
          <h1 className="text-2xl font-bold text-ink">{t("dashboard:title")}</h1>
          <p className="text-sm text-gray-500">{t("dashboard:subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("common:fields.project")}>
            <Select value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="">{t("dashboard:all_projects")}</option>
              {(projects.data as Project[] | undefined)?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.month")}>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </Field>
        </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, money }) => (
          <div key={label} className="rounded-lg border border-gray-200 border-t-site bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-ink">{money ? formatMoney(value as string | number) : formatNumber(value as string | number)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={t("dashboard:charts.cash_in_vs_cash_out")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={tooltipFormatter} labelFormatter={formatMonth} />
                <Legend />
                <Bar dataKey="cash_in" fill="#a30f17" name={t("common:fields.cash_in")} />
                <Bar dataKey="cash_out" fill="#b45309" name={t("common:fields.cash_out")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.monthly_expense_trend")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={tooltipFormatter} labelFormatter={formatMonth} />
                <Legend />
                <Line dataKey="cash_out" stroke="#a30f17" name={t("common:fields.cash_out")} strokeWidth={2} />
                <Line dataKey="paid" stroke="#16a34a" name={t("common:fields.paid")} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.category_cost")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories.data || []} dataKey="total" nameKey="category__name" outerRadius={100} label>
                  {(categories.data || []).map((_: unknown, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.top_vendors")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendors.data || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                <YAxis type="category" dataKey="vendor__name" width={120} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="total" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.paid_vs_pending")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paidPendingData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {paidPendingData.map((_: unknown, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.approval_status")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="approval_status_label" />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("dashboard:charts.payment_status")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="payment_status_label" />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#b45309" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
