"use client";

import { useState, useEffect, useCallback } from "react";
import { transactionsApi } from "@/lib/api";
import { SummaryResponse, Transaction } from "@/types";
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr + "-01");
  return d.toLocaleString("default", { month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, txnRes] = await Promise.all([
        transactionsApi.summary({ month: currentMonth + "-01" }),
        transactionsApi.list({ date_from: currentMonth + "-01", date_to: currentMonth + "-31", page: 1, page_size: 5 }),
      ]);
      setSummary(summaryRes.data);
      setRecentTxns(txnRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const pieData = (summary?.by_category ?? [])
    .filter((c) => c.type === "expense")
    .map((c) => ({ name: c.category_name, value: c.total }));

  const barData = (summary?.monthly ?? []).map((m) => ({
    month: getMonthLabel(m.month),
    Income: m.income,
    Expense: m.expense,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
          <button onClick={() => changeMonth(-1)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[100px] text-center">
            {getMonthLabel(currentMonth)}
          </span>
          <button onClick={() => changeMonth(1)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Income"
              value={formatIDR(summary?.total_income || 0)}
              icon={<TrendingUp size={20} className="text-emerald-500" />}
              color="emerald"
            />
            <SummaryCard
              title="Total Expense"
              value={formatIDR(summary?.total_expense || 0)}
              icon={<TrendingDown size={20} className="text-red-500" />}
              color="red"
            />
            <SummaryCard
              title="Balance"
              value={formatIDR(summary?.balance || 0)}
              icon={<Wallet size={20} className="text-blue-500" />}
              color="blue"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Income vs Expense (6 months)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "M"} />
                  <Tooltip formatter={(v: number) => formatIDR(v)} />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Expense Breakdown
              </h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
                  No expense data this month
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatIDR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Recent Transactions
            </h2>
            {recentTxns.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No transactions yet</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.category_icon || "📦"}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t.category_name || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.note || t.transaction_date?.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{formatIDR(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "red" | "blue";
}) {
  const bg = { emerald: "bg-emerald-50 dark:bg-emerald-900/20", red: "bg-red-50 dark:bg-red-900/20", blue: "bg-blue-50 dark:bg-blue-900/20" };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`${bg[color]} p-2 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}
