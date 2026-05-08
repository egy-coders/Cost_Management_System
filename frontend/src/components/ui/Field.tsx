import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="min-h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-site focus:ring-2 focus:ring-teal-100" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="min-h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-site focus:ring-2 focus:ring-teal-100" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-site focus:ring-2 focus:ring-teal-100" {...props} />;
}
