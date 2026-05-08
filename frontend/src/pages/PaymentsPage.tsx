import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, apiError, formatMoney, rows } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import { formatDate } from "../i18n/format";
import type { Expense, Payment } from "../types";

export function PaymentsPage() {
  const qc = useQueryClient();
  const { t } = useTranslation(["payments", "common"]);
  const [form, setForm] = useState({ expense: "", amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_method: "BANK_TRANSFER", reference_number: "", notes: "" });
  const [error, setError] = useState("");
  const payments = useQuery({ queryKey: ["payments"], queryFn: async () => rows<Payment>((await api.get("/payments/")).data) });
  const expenses = useQuery({ queryKey: ["approved-expenses"], queryFn: async () => rows<Expense>((await api.get("/expenses/?approval_status=APPROVED&payment_status=PARTIALLY_PAID")).data) });
  const unpaid = useQuery({ queryKey: ["approved-unpaid-expenses"], queryFn: async () => rows<Expense>((await api.get("/expenses/?approval_status=APPROVED&payment_status=UNPAID")).data) });
  const payable = [...(expenses.data || []), ...(unpaid.data || [])];

  const save = useMutation({
    mutationFn: async () => api.post("/payments/", { ...form, expense: Number(form.expense) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      setForm({ expense: "", amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_method: "BANK_TRANSFER", reference_number: "", notes: "" });
      setError("");
    },
    onError: (err) => setError(apiError(err))
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("payments:title")}</h1>
        <p className="text-sm text-gray-500">{t("payments:subtitle")}</p>
      </div>
      <Panel title={t("payments:add")}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
          <Field label={t("common:fields.expense")}>
            <Select value={form.expense} onChange={(e) => setForm({ ...form, expense: e.target.value })} required>
              <option value="">{t("payments:select_approved_expense")}</option>
              {payable.map((expense) => <option key={expense.id} value={expense.id}>{expense.description} - {t("payments:pending_option", { amount: formatMoney(expense.pending_amount, expense.project_detail?.currency) })}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.amount")}><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
          <Field label={t("common:fields.date")}><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required /></Field>
          <Field label={t("common:fields.method")}>
            <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              <option value="CASH">{t("common:payment_methods.CASH")}</option>
              <option value="BANK_TRANSFER">{t("common:payment_methods.BANK_TRANSFER")}</option>
              <option value="CHEQUE">{t("common:payment_methods.CHEQUE")}</option>
              <option value="CARD">{t("common:payment_methods.CARD")}</option>
              <option value="OTHER">{t("common:payment_methods.OTHER")}</option>
            </Select>
          </Field>
          <Field label={t("common:fields.reference")}><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></Field>
          <div className="lg:col-span-5">
            <Field label={t("common:fields.notes")}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-5">{error}</div>}
          <div className="lg:col-span-5"><Button type="submit" disabled={save.isPending}>{t("payments:record")}</Button></div>
        </form>
      </Panel>
      <Panel title={t("payments:register")}>
        {payments.isLoading ? <LoadingState /> : payments.data?.length ? (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr><th className="px-4 py-3">{t("common:fields.date")}</th><th className="px-4 py-3">{t("common:fields.expense")}</th><th className="px-4 py-3">{t("common:fields.project")}</th><th className="px-4 py-3">{t("common:fields.amount")}</th><th className="px-4 py-3">{t("common:fields.method")}</th><th className="px-4 py-3">{t("common:fields.reference")}</th><th className="px-4 py-3">{t("common:fields.expense_status")}</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.data.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 font-semibold">{payment.expense_detail?.description}</td>
                    <td className="px-4 py-3">{payment.expense_detail?.project_detail?.name}</td>
                    <td className="px-4 py-3">{formatMoney(payment.amount, payment.expense_detail?.project_detail?.currency)}</td>
                    <td className="px-4 py-3">{t(`common:payment_methods.${payment.payment_method}`, { defaultValue: payment.payment_method })}</td>
                    <td className="px-4 py-3">{payment.reference_number}</td>
                    <td className="px-4 py-3">{payment.expense_detail && <Badge value={payment.expense_detail.payment_status} />}</td>
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
