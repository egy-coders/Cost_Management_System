import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Check, FileUp, Pencil, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, apiError, formatMoney } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { LoadingState } from "../components/ui/State";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "../i18n/format";
import type { Attachment, Expense, Payment } from "../types";

interface ApprovalLog {
  id: number;
  action: string;
  from_status: string;
  to_status: string;
  comment: string;
  created_at: string;
  user_detail?: { name: string; email: string };
}

export function ExpenseDetailsPage() {
  const { id } = useParams();
  const { can, user } = useAuth();
  const { t } = useTranslation(["expenses", "payments", "common"]);
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [payment, setPayment] = useState({ amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_method: "BANK_TRANSFER", reference_number: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);

  const expense = useQuery({ queryKey: ["expense", id], queryFn: async () => (await api.get<Expense>(`/expenses/${id}/`)).data });
  const payments = useQuery({ queryKey: ["expense-payments", id], queryFn: async () => (await api.get<Payment[]>(`/expenses/${id}/payments/`)).data });
  const attachments = useQuery({ queryKey: ["expense-attachments", id], queryFn: async () => (await api.get<Attachment[]>(`/expenses/${id}/attachments/`)).data });
  const logs = useQuery({ queryKey: ["expense-logs", id], queryFn: async () => (await api.get<ApprovalLog[]>(`/expenses/${id}/approval-logs/`)).data });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["expense", id] });
    qc.invalidateQueries({ queryKey: ["expense-payments", id] });
    qc.invalidateQueries({ queryKey: ["expense-attachments", id] });
    qc.invalidateQueries({ queryKey: ["expense-logs", id] });
  };

  const submitAction = useMutation({
    mutationFn: async () => api.post(`/expenses/${id}/submit/`),
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err))
  });
  const approveAction = useMutation({
    mutationFn: async () => api.post(`/expenses/${id}/approve/`, { comment: t("common:messages.approved_from_web") }),
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err))
  });
  const rejectAction = useMutation({
    mutationFn: async () => api.post(`/expenses/${id}/reject/`, { rejection_reason: rejectReason }),
    onSuccess: () => {
      setRejectReason("");
      invalidate();
    },
    onError: (err) => setError(apiError(err))
  });
  const addPayment = useMutation({
    mutationFn: async () => api.post("/payments/", { ...payment, expense: Number(id) }),
    onSuccess: () => {
      setPayment({ amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_method: "BANK_TRANSFER", reference_number: "", notes: "" });
      invalidate();
    },
    onError: (err) => setError(apiError(err))
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const data = new FormData();
      data.append("file", file);
      data.append("related_type", "EXPENSE");
      data.append("related_id", String(id));
      return api.post("/attachments/", data);
    },
    onSuccess: () => {
      setFile(null);
      invalidate();
    },
    onError: (err) => setError(apiError(err))
  });

  if (expense.isLoading) return <LoadingState />;
  const item = expense.data!;
  const canSubmit = item.approval_status === "DRAFT" || item.approval_status === "REJECTED";
  const canDecide = item.approval_status === "SUBMITTED" && can("PROJECT_MANAGER");
  const canPay = item.approval_status === "APPROVED" && item.payment_status !== "PAID" && can("ACCOUNTANT");
  const canEdit = user?.role === "ADMIN" || (user?.role === "SITE_ENGINEER" && ["DRAFT", "REJECTED"].includes(item.approval_status));

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    addPayment.mutate();
  }

  async function downloadAttachment(attachment: Attachment) {
    const response = await api.get(`/attachments/${attachment.id}/download/`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.original_file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{item.description}</h1>
          <p className="text-sm text-gray-500">{item.project_detail?.name} / {item.category_detail?.name} / {item.vendor_detail?.name || t("common:messages.no_vendor")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={item.approval_status} />
          <Badge value={item.payment_status} />
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {canEdit && <Link to={`/expenses/${id}/edit`}><Button variant="secondary"><Pencil size={18} />{t("common:actions.edit")}</Button></Link>}
        {canSubmit && <Button onClick={() => submitAction.mutate()}><Send size={18} />{t("common:actions.submit")}</Button>}
        {canDecide && <Button onClick={() => confirm(t("common:confirms.approve_expense")) && approveAction.mutate()}><Check size={18} />{t("common:actions.approve")}</Button>}
      </div>

      {canDecide && (
        <Panel title={t("expenses:reject_expense")}>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Textarea placeholder={t("expenses:rejection_reason_placeholder")} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <Button variant="danger" onClick={() => confirm(t("common:confirms.reject_expense")) && rejectAction.mutate()} disabled={!rejectReason}><X size={18} />{t("common:actions.reject")}</Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title={t("expenses:financial_summary")} className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [t("common:fields.before_vat"), item.amount_before_vat],
              [t("common:fields.vat"), item.vat_amount],
              [t("common:fields.total"), item.total_amount],
              [t("common:fields.paid"), item.paid_amount],
              [t("common:fields.pending"), item.pending_amount]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                <p className="mt-1 font-bold">{formatMoney(value as string, item.project_detail?.currency)}</p>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-gray-500">{t("common:fields.date")}</dt><dd>{formatDate(item.expense_date)}</dd></div>
            <div><dt className="font-semibold text-gray-500">{t("common:fields.quantity")}</dt><dd>{formatNumber(item.quantity)} {t(`common:units.${item.unit}`, { defaultValue: item.unit })}</dd></div>
            <div><dt className="font-semibold text-gray-500">{t("common:fields.unit_rate")}</dt><dd>{formatMoney(item.unit_rate, item.project_detail?.currency)}</dd></div>
            <div><dt className="font-semibold text-gray-500">{t("common:fields.vat_percentage")}</dt><dd>{formatPercent(item.vat_percentage)}</dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-gray-500">{t("common:fields.notes")}</dt><dd>{item.notes || "-"}</dd></div>
            {item.rejection_reason && <div className="sm:col-span-2"><dt className="font-semibold text-red-600">{t("common:fields.rejection_reason")}</dt><dd>{item.rejection_reason}</dd></div>}
          </dl>
        </Panel>
        <Panel title={t("expenses:upload_attachment")}>
          <div className="grid gap-3">
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button onClick={() => upload.mutate()} disabled={!file}><FileUp size={18} />{t("common:actions.upload")}</Button>
          </div>
        </Panel>
      </div>

      {canPay && (
        <Panel title={t("expenses:add_payment")}>
          <form onSubmit={submitPayment} className="grid gap-4 md:grid-cols-5">
            <Field label={t("common:fields.amount")}><Input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required /></Field>
            <Field label={t("common:fields.date")}><Input type="date" value={payment.payment_date} onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })} required /></Field>
            <Field label={t("common:fields.method")}>
              <Select value={payment.payment_method} onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}>
                <option value="CASH">{t("common:payment_methods.CASH")}</option>
                <option value="BANK_TRANSFER">{t("common:payment_methods.BANK_TRANSFER")}</option>
                <option value="CHEQUE">{t("common:payment_methods.CHEQUE")}</option>
                <option value="CARD">{t("common:payment_methods.CARD")}</option>
                <option value="OTHER">{t("common:payment_methods.OTHER")}</option>
              </Select>
            </Field>
            <Field label={t("common:fields.reference")}><Input value={payment.reference_number} onChange={(e) => setPayment({ ...payment, reference_number: e.target.value })} /></Field>
            <div className="flex items-end"><Button type="submit">{t("payments:add")}</Button></div>
          </form>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title={t("expenses:payment_history")}>
          <div className="grid gap-2 text-sm">
            {(payments.data || []).map((payment) => (
              <div key={payment.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex justify-between gap-3"><span className="font-semibold">{formatMoney(payment.amount, item.project_detail?.currency)}</span><span>{formatDate(payment.payment_date)}</span></div>
                <p className="text-gray-500">{t(`common:payment_methods.${payment.payment_method}`, { defaultValue: payment.payment_method })} {payment.reference_number}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={t("expenses:attachments")}>
          <div className="grid gap-2 text-sm">
            {(attachments.data || []).map((attachment) => (
              <button key={attachment.id} onClick={() => downloadAttachment(attachment)} className="rounded-md border border-gray-200 p-3 text-left font-semibold text-site hover:bg-gray-50">
                {attachment.original_file_name}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title={t("expenses:approval_history")}>
          <div className="grid gap-2 text-sm">
            {(logs.data || []).map((log) => (
              <div key={log.id} className="rounded-md border border-gray-200 p-3">
                <div className="font-semibold">{t(`common:statuses.${log.action}`, { defaultValue: log.action.replaceAll("_", " ") })}</div>
                <div className="text-gray-500">{log.user_detail?.name || t("common:messages.system")} - {formatDateTime(log.created_at)}</div>
                {log.comment && <div className="mt-1 text-gray-700">{log.comment}</div>}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
