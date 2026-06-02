"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getUser, removeToken } from "@/lib/auth";
import { authApi } from "@/lib/api";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Tag,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions",  label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets",       label: "Budgets",      icon: Target },
  { href: "/categories",    label: "Categories",   icon: Tag },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    const user = getUser();
    if (user) setUserName(user.name);
  }, [router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    removeToken();
    document.cookie = "ft_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-slate-800 dark:text-white">Finance Tracker</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-slate-800 dark:text-white">Finance Tracker</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
