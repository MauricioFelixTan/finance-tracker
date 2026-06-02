"use client";

import { useState, useEffect, useCallback } from "react";
import { budgetsApi, categoriesApi } from "@/lib/api";
import { Budget, Category } from "@/types";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState({ category_id: "", limit_amount: "", period: "monthly" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetsApi.list({ month: currentMonth });
      setBudgets(res.data.data || []);
    } catch {}
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  useEffect(() => {
    categoriesApi.list().then((r) => {
      const expCats = (r.data.data || []).filter((c: Category) => c.type === "expense");
      setCategories(expCats);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: "", limit_amount: "", period: "monthly" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({ category_id: b.category_id, limit_amount: String(b.limit_amount), period: b.period });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await budgetsApi.update(editing.id, { limit_amount: parseFloat(form.limit_amount) });
      } else {
        await budgetsApi.create({
          category_id: form.category_id,
          limit_amount: parseFloat(form.limit_amount),
          period: form.period,
        });
      }
      setShowModal(false);
      fetchBudgets();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    await budgetsApi.delete(id);
    fetchBudgets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Budgets</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
        >
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-500 dark:text-slate-400">No budgets set yet. Click &quot;Set Budget&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.limit_amount > 0 ? (b.spent / b.limit_amount) * 100 : 0;
            const over80 = pct >= 80;
            const over100 = pct >= 100;
            return (
              <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{b.category_icon || "📦"}</span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{b.category_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{b.period}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatIDR(b.spent)} spent</span>
                    <span>Limit: {formatIDR(b.limit_amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        over100 ? "bg-red-500" : over80 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${over100 ? "text-red-500" : over80 ? "text-amber-500" : "text-slate-500"}`}>
                      {pct.toFixed(0)}% used
                    </span>
                    {over80 && (
                      <span className={`flex items-center gap-1 text-xs ${over100 ? "text-red-500" : "text-amber-500"}`}>
                        <AlertTriangle size={12} />
                        {over100 ? "Over budget!" : "Near limit"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              {editing ? "Edit Budget" : "Set New Budget"}
            </h2>
            <div className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">
                    <option value="">Select expense category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Limit Amount</label>
                <input type="number" min="1" step="any" value={form.limit_amount}
                  onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm"
                  placeholder="0" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Period</label>
                  <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || (!editing && !form.category_id) || !form.limit_amount}
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
