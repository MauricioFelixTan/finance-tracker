"use client";

import { useState, useEffect, useCallback } from "react";
import { categoriesApi } from "@/lib/api";
import { Category } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list();
      setCategories(res.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "expense", icon: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, icon: c.icon || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, { name: form.name, icon: form.icon });
      } else {
        await categoriesApi.create({ name: form.name, type: form.type, icon: form.icon });
      }
      setShowModal(false);
      fetchCats();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This will fail if it has transactions.")) return;
    try {
      await categoriesApi.delete(id);
      fetchCats();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || "Cannot delete");
    }
  };

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryGroup title="Expense Categories" emoji="💸" categories={expense} onEdit={openEdit} onDelete={handleDelete} />
          <CategoryGroup title="Income Categories" emoji="💰" categories={income} onEdit={openEdit} onDelete={handleDelete} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              {editing ? "Edit Category" : "New Category"}
            </h2>
            <div className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <div className="flex gap-3">
                    {(["expense", "income"] as const).map((t) => (
                      <label key={t} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors
                        ${form.type === t ? (t === "expense" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20") : "border-slate-200 dark:border-slate-600"}`}>
                        <input type="radio" value={t} checked={form.type === t}
                          onChange={() => setForm({ ...form, type: t })} className="sr-only" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm"
                  placeholder="e.g. Groceries" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Icon (emoji)</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm"
                  placeholder="🛒" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name}
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

function CategoryGroup({
  title,
  emoji,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  emoji: string;
  categories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No categories</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{c.icon || "📦"}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{c.name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(c)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(c.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
