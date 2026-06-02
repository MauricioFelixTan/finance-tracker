"use client";

import { useState, useEffect, useCallback } from "react";
import { transactionsApi, categoriesApi } from "@/lib/api";
import { Transaction, Category, TransactionListResponse } from "@/types";
import { Plus, Pencil, Trash2, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

interface TxnForm {
  category_id: string;
  amount: string;
  type: "income" | "expense";
  note: string;
  transaction_date: string;
}

const emptyForm: TxnForm = {
  category_id: "",
  amount: "",
  type: "expense",
  note: "",
  transaction_date: new Date().toISOString().slice(0, 10),
};

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TxnForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    type: "",
    category_id: "",
    date_from: "",
    date_to: "",
    search: "",
    page: 1,
  });

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: filters.page, page_size: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      const res = await transactionsApi.list(params);
      const data = res.data as TransactionListResponse;
      setTxns(data.data || []);
      setMeta({ total: data.total, page: data.page, total_pages: data.total_pages });
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data.data || []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      category_id: t.category_id,
      amount: String(t.amount),
      type: t.type,
      note: t.note || "",
      transaction_date: t.transaction_date?.slice(0, 10) || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id,
        amount: parseFloat(form.amount),
        type: form.type,
        note: form.note,
        transaction_date: form.transaction_date,
      };
      if (editing) {
        await transactionsApi.update(editing.id, payload);
      } else {
        await transactionsApi.create(payload);
      }
      setShowModal(false);
      fetchTxns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    await transactionsApi.delete(id);
    fetchTxns();
  };

  const handleExport = async () => {
    const params: Record<string, string> = {};
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.type) params.type = filters.type;
    const res = await transactionsApi.exportCsv(params);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${filters.date_from || "all"}_${filters.date_to || "all"}.csv`;
    a.click();
  };

  const filteredCats = categories.filter((c) => !form.type || c.type === form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search note…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Note</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Type</th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {txns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.transaction_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span>{t.category_icon || "📦"}</span>{t.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{t.note || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                        ${t.type === "income"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{formatIDR(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500">
              {meta.total} total transactions
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-500">
                {meta.page} / {meta.total_pages}
              </span>
              <button
                disabled={meta.page >= meta.total_pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              {editing ? "Edit Transaction" : "New Transaction"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors
                  ${form.type === "expense" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-600"}`}>
                  <input type="radio" value="expense" checked={form.type === "expense"}
                    onChange={() => setForm({ ...form, type: "expense", category_id: "" })} className="sr-only" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">💸 Expense</span>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors
                  ${form.type === "income" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-600"}`}>
                  <input type="radio" value="income" checked={form.type === "income"}
                    onChange={() => setForm({ ...form, type: "income", category_id: "" })} className="sr-only" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">💰 Income</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">
                  <option value="">Select category</option>
                  {filteredCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                <input type="number" min="1" step="any" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input type="date" value={form.transaction_date}
                  onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note</label>
                <input type="text" value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm"
                  placeholder="Optional note…" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.category_id || !form.amount}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
