import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, apiError, formatMoney, rows } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import { formatDate } from "../i18n/format";
import type { CashIn, Project } from "../types";

export function CashInPage() {
  const qc = useQueryClient();
  const { t } = useTranslation(["cashIn", "projects", "common"]);
  const [form, setForm] = useState({ project: "", payment_type: "CLIENT_INVOICE", reference_number: "", amount: "", received_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [error, setError] = useState("");
  const cashIn = useQuery({ queryKey: ["cash-in"], queryFn: async () => rows<CashIn>((await api.get("/cash-in/")).data) });
  const projects = useQuery({ queryKey: ["projects"], queryFn: async () => rows<Project>((await api.get("/projects/")).data) });
  const save = useMutation({
    mutationFn: async () => api.post("/cash-in/", { ...form, project: Number(form.project) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-in"] });
      setForm({ project: "", payment_type: "CLIENT_INVOICE", reference_number: "", amount: "", received_date: new Date().toISOString().slice(0, 10), notes: "" });
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
      <div><h1 className="text-2xl font-bold text-ink">{t("cashIn:title")}</h1><p className="text-sm text-gray-500">{t("cashIn:subtitle")}</p></div>
      <Panel title={t("cashIn:add")}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
          <Field label={t("common:fields.project")}><Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required><option value="">{t("projects:select_project")}</option>{(projects.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label={t("common:fields.type")}><Select value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}><option value="DOWN_PAYMENT">{t("common:cash_in_types.DOWN_PAYMENT")}</option><option value="IPA">{t("common:cash_in_types.IPA")}</option><option value="CLIENT_INVOICE">{t("common:cash_in_types.CLIENT_INVOICE")}</option><option value="ADVANCE">{t("common:cash_in_types.ADVANCE")}</option><option value="OTHER">{t("common:cash_in_types.OTHER")}</option></Select></Field>
          <Field label={t("common:fields.reference")}><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></Field>
          <Field label={t("common:fields.amount")}><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
          <Field label={t("common:fields.date")}><Input type="date" value={form.received_date} onChange={(e) => setForm({ ...form, received_date: e.target.value })} required /></Field>
          <div className="lg:col-span-5"><Field label={t("common:fields.notes")}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-5">{error}</div>}
          <div className="lg:col-span-5"><Button type="submit">{t("cashIn:record")}</Button></div>
        </form>
      </Panel>
      <Panel title={t("cashIn:register")}>
        {cashIn.isLoading ? <LoadingState /> : cashIn.data?.length ? (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><tr><th className="px-4 py-3">{t("common:fields.date")}</th><th className="px-4 py-3">{t("common:fields.project")}</th><th className="px-4 py-3">{t("common:fields.type")}</th><th className="px-4 py-3">{t("common:fields.reference")}</th><th className="px-4 py-3">{t("common:fields.amount")}</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{cashIn.data.map((item) => <tr key={item.id}><td className="px-4 py-3">{formatDate(item.received_date)}</td><td className="px-4 py-3">{item.project_detail?.name}</td><td className="px-4 py-3">{t(`common:cash_in_types.${item.payment_type}`, { defaultValue: item.payment_type })}</td><td className="px-4 py-3">{item.reference_number}</td><td className="px-4 py-3">{formatMoney(item.amount, item.project_detail?.currency)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
