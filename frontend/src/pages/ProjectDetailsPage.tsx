import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { api, formatMoney, rows } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Panel } from "../components/ui/Panel";
import { LoadingState } from "../components/ui/State";
import { formatDate, formatMonth, formatNumber } from "../i18n/format";
import type { CashIn, Expense } from "../types";

function chartRows(data: Record<string, unknown>[]) {
  return data.map((row) => ({ ...row, cash_out: Number(row.cash_out || 0), paid: Number(row.paid || 0), pending: Number(row.pending || 0) }));
}

export function ProjectDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation(["projects", "common"]);
  const summary = useQuery({
    queryKey: ["project-summary", id],
    queryFn: async () => (await api.get(`/projects/${id}/summary/`)).data
  });
  const expenses = useQuery({
    queryKey: ["project-expenses", id],
    queryFn: async () => rows<Expense>((await api.get(`/expenses/?project=${id}`)).data)
  });
  const cashIn = useQuery({
    queryKey: ["project-cash-in", id],
    queryFn: async () => rows<CashIn>((await api.get(`/cash-in/?project=${id}`)).data)
  });

  if (summary.isLoading) return <LoadingState />;
  const project = summary.data.project;
  const totals = summary.data.totals;
  const tooltipFormatter = (value: unknown, name: string) => [formatMoney(value as string | number, project.currency), t(`common:fields.${name}`, { defaultValue: name.replaceAll("_", " ") })];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{project.code} - {project.name}</h1>
          <p className="text-sm text-gray-500">{project.client_name} | {project.location}</p>
        </div>
        <Badge value={project.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          [t("common:fields.cash_in"), totals.total_cash_in],
          [t("common:fields.cash_out"), totals.total_cash_out],
          [t("common:fields.paid"), totals.total_paid],
          [t("common:fields.pending"), totals.total_pending],
          [t("common:fields.balance"), totals.cash_balance],
          [t("common:fields.cost_gap"), totals.project_cost_gap]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
            <p className="mt-2 text-lg font-bold">{formatMoney(value as string | number, project.currency)}</p>
          </div>
        ))}
      </div>

      <Panel title={t("projects:monthly_cost")}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows(summary.data.monthly_costs || [])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={(value) => formatNumber(value)} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={formatMonth} />
              <Bar dataKey="cash_out" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={t("projects:related_expenses")}>
          <div className="table-scroll max-h-96 overflow-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {(expenses.data || []).map((expense) => (
                  <tr key={expense.id}>
                    <td className="py-3"><Link to={`/expenses/${expense.id}`} className="font-semibold text-site hover:underline">{expense.description}</Link></td>
                    <td className="py-3 text-right">{formatMoney(expense.total_amount, project.currency)}</td>
                    <td className="py-3 text-right"><Badge value={expense.approval_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={t("common:fields.cash_in")}>
          <div className="table-scroll max-h-96 overflow-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {(cashIn.data || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-semibold">{item.reference_number || t(`common:cash_in_types.${item.payment_type}`, { defaultValue: item.payment_type })}</td>
                    <td className="py-3">{formatDate(item.received_date)}</td>
                    <td className="py-3 text-right">{formatMoney(item.amount, project.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
