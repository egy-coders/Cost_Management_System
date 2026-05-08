import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Download, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, formatMoney, queryString, rows } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatNumber, formatPercent } from "../i18n/format";
import type { Category, Expense, Project, Vendor } from "../types";

export function ExpensesPage() {
  const { can } = useAuth();
  const { t } = useTranslation(["expenses", "common"]);
  const [filters, setFilters] = useState({ search: "", project: "", category: "", vendor: "", approval_status: "", payment_status: "", month: "" });
  const qs = queryString(filters);
  const expenses = useQuery({
    queryKey: ["expenses", qs],
    queryFn: async () => rows<Expense>((await api.get(`/expenses/?${qs}`)).data)
  });
  const projects = useQuery({ queryKey: ["projects"], queryFn: async () => rows<Project>((await api.get("/projects/")).data) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => rows<Category>((await api.get("/categories/")).data) });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: async () => rows<Vendor>((await api.get("/vendors/")).data) });

  async function downloadExport() {
    const response = await api.get(`/reports/export/excel/?report=pending-payments&${qs}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pending-payments.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("expenses:title")}</h1>
          <p className="text-sm text-gray-500">{t("expenses:subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={downloadExport}><Download size={18} />{t("common:actions.export")}</Button>
          {can("SITE_ENGINEER") && <Link to="/expenses/new"><Button><Plus size={18} />{t("expenses:add")}</Button></Link>}
        </div>
      </div>

      <Panel title={t("expenses:filters")}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label={t("common:fields.search")}><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder={t("expenses:search_placeholder")} /></Field>
          <Field label={t("common:fields.project")}>
            <Select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
              <option value="">{t("common:messages.all")}</option>
              {(projects.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.category")}>
            <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">{t("common:messages.all")}</option>
              {(categories.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.vendor")}>
            <Select value={filters.vendor} onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}>
              <option value="">{t("common:messages.all")}</option>
              {(vendors.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.approval")}>
            <Select value={filters.approval_status} onChange={(e) => setFilters({ ...filters, approval_status: e.target.value })}>
              <option value="">{t("common:messages.all")}</option>
              <option value="DRAFT">{t("common:statuses.DRAFT")}</option>
              <option value="SUBMITTED">{t("common:statuses.SUBMITTED")}</option>
              <option value="APPROVED">{t("common:statuses.APPROVED")}</option>
              <option value="REJECTED">{t("common:statuses.REJECTED")}</option>
            </Select>
          </Field>
          <Field label={t("common:fields.payment")}>
            <Select value={filters.payment_status} onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}>
              <option value="">{t("common:messages.all")}</option>
              <option value="UNPAID">{t("common:statuses.UNPAID")}</option>
              <option value="PARTIALLY_PAID">{t("common:statuses.PARTIALLY_PAID")}</option>
              <option value="PAID">{t("common:statuses.PAID")}</option>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title={t("expenses:register")}>
        {expenses.isLoading ? <LoadingState /> : expenses.data?.length ? (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-[1200px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  {["date", "project", "category", "vendor", "description", "quantity", "unit", "unit_rate", "vat_percentage", "total", "paid", "pending", "approval", "payment", "actions"].map((header) => <th key={header} className="px-3 py-3">{t(`common:fields.${header}`)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">{formatDate(expense.expense_date)}</td>
                    <td className="px-3 py-3">{expense.project_detail?.name}</td>
                    <td className="px-3 py-3">{expense.category_detail?.name}</td>
                    <td className="px-3 py-3">{expense.vendor_detail?.name || "-"}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{expense.description}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(expense.quantity)}</td>
                    <td className="px-3 py-3">{t(`common:units.${expense.unit}`, { defaultValue: expense.unit })}</td>
                    <td className="px-3 py-3 text-right">{formatMoney(expense.unit_rate, expense.project_detail?.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatPercent(expense.vat_percentage)}</td>
                    <td className="px-3 py-3 text-right">{formatMoney(expense.total_amount, expense.project_detail?.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatMoney(expense.paid_amount, expense.project_detail?.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatMoney(expense.pending_amount, expense.project_detail?.currency)}</td>
                    <td className="px-3 py-3"><Badge value={expense.approval_status} /></td>
                    <td className="px-3 py-3"><Badge value={expense.payment_status} /></td>
                    <td className="px-3 py-3"><Link className="font-semibold text-site hover:underline" to={`/expenses/${expense.id}`}>{t("common:actions.open")}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
