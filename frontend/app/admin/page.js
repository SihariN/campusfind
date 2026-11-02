
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  SearchCheck,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  AlertCircle,
  House,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import {
  getAdminProfile,
  getAdminDashboardStats,
  getAdminRecentActivity,
} from "../../lib/api";

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Listings", href: "/admin/listings", icon: PackageSearch },
  { label: "Users", href: "/admin/users", icon: Users },
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActivityIcon(type) {
  if (type === "user_registered") return Users;
  if (type === "listing_created") return Package;
  return Activity;
}

function getActivityColor(type) {
  if (type === "user_registered") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
  }

  if (type === "listing_created") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:shadow-black/20 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {formatNumber(value)}
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={23} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const Icon = getActivityIcon(activity.type);

  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getActivityColor(activity.type)}`}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {activity.title}
          </p>

          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
            {formatDate(activity.created_at)}
          </span>
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm font-bold text-slate-900 dark:text-white"
        >
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(null);

  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const [adminData, statsData, activityData] = await Promise.all([
        getAdminProfile(),
        getAdminDashboardStats(),
        getAdminRecentActivity(15),
      ]);

      setAdmin(adminData);
      setStats(statsData);
      setActivities(activityData.activities || []);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err.message || "Could not load the admin dashboard.";

      if (
        message.toLowerCase().includes("administrator") ||
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("not authenticated")
      ) {
        router.replace("/");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("campusfind_theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );

    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
  setCurrentYear(new Date().getFullYear());
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("campusfind_theme", nextTheme);
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );
  }

  function logout() {
    localStorage.removeItem("campusfind_token");
    router.replace("/login");
  }

  const listingChartData = useMemo(
    () => [
      {
        name: "Lost",
        reports: stats?.total_lost_reports ?? 0,
      },
      {
        name: "Found",
        reports: stats?.total_found_reports ?? 0,
      },
    ],
    [stats]
  );

  const statusChartData = useMemo(
    () => [
      {
        name: "Open",
        reports: stats?.open_reports ?? 0,
      },
      {
        name: "Pending",
        reports: stats?.recovery_pending_reports ?? 0,
      },
      {
        name: "Resolved",
        reports: stats?.resolved_reports ?? 0,
      },
    ],
    [stats]
  );

  const totalReports =
    (stats?.total_lost_reports ?? 0) +
    (stats?.total_found_reports ?? 0);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 transition-colors duration-300 dark:bg-[#080d19] dark:text-slate-100">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#10182b] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.08] px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black shadow-lg shadow-blue-500/20">
              C
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                CampusFind<span className="text-blue-400">.</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/admin";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}

                  {active && (
                    <ChevronRight size={16} className="ml-auto opacity-80" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-9 px-5">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Platform
          </p>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowUpRight size={19} />
            Back to Homepage
          </Link>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Protected workspace
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Administrative access is verified securely by CampusFind.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/85 sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                Admin workspace
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                CampusFind / Overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden h-9 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-sm font-bold text-slate-800 dark:text-white">
                  {admin?.email || "Administrator"}
                </p>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                {admin?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          {/* Page heading */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Sparkles size={13} />
                Platform overview
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Welcome back. Here's what's happening across your CampusFind
                community.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                >
                    <House size={16} />
                    Back to Homepage
                </Link>

                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17233d] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                    />
                    Refresh data
                </button>
            </div>
          </div>

          {lastUpdated && !loading && (
            <p className="mb-5 text-xs text-slate-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}

          {/* Error state */}
          {error && (
            <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/30 sm:flex-row sm:items-center">
              <AlertCircle className="shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
                  Unable to load dashboard data
                </p>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !stats ? (
            <div className="space-y-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="h-80 animate-pulse rounded-2xl bg-white dark:bg-slate-900 xl:col-span-2" />
                <div className="h-80 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Statistics */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total users"
                  value={stats.total_users}
                  subtitle={`${formatNumber(stats.recent_users)} joined in the last 7 days`}
                  icon={Users}
                  color="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                />

                <StatCard
                  title="Total reports"
                  value={totalReports}
                  subtitle={`${formatNumber(stats.recent_reports)} created in the last 7 days`}
                  icon={PackageSearch}
                  color="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                />

                <StatCard
                  title="Open reports"
                  value={stats.open_reports}
                  subtitle="Listings currently awaiting recovery"
                  icon={Clock3}
                  color="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                />

                <StatCard
                  title="Resolved reports"
                  value={stats.resolved_reports}
                  subtitle="Successfully marked as resolved"
                  icon={CheckCircle2}
                  color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                />
              </section>

              {/* Charts */}
              <section className="mt-7 grid gap-6 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 xl:col-span-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Lost & found reports
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Current report distribution
                      </p>
                    </div>

                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {formatNumber(totalReports)} total
                    </span>
                  </div>

                  <div className="mt-7 h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={listingChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barCategoryGap="38%"
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="currentColor"
                          opacity={0.1}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="reports"
                          name="Reports"
                          fill="#6366f1"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={65}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Lost reports
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatNumber(stats.total_lost_reports)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Found reports
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {formatNumber(stats.total_found_reports)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 xl:col-span-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Report status
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Current status breakdown
                    </p>
                  </div>

                  <div className="mt-7 h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                        barCategoryGap="35%"
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          horizontal={false}
                          stroke="currentColor"
                          opacity={0.1}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          width={65}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="reports"
                          name="Reports"
                          fill="#10b981"
                          radius={[0, 7, 7, 0]}
                          maxBarSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {statusChartData.map((item) => (
                      <div key={item.name}>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.name}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {formatNumber(item.reports)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Activity and summary */}
              <section className="mt-7 grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 xl:col-span-2">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Recent activity
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        The latest activity across CampusFind
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Activity size={17} />
                    </div>
                  </div>

                  {activities.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activities.slice(0, 8).map((activity, index) => (
                        <ActivityItem
                          key={`${activity.type}-${activity.item_id ?? activity.user_id ?? index}-${activity.created_at}`}
                          activity={activity}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">
                        <Activity size={25} />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        No recent activity
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        New platform activity will appear here.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#172554] via-[#312e81] to-[#4f46e5] p-6 text-white shadow-xl shadow-indigo-900/15">
                    <div className="flex items-center gap-2 text-indigo-200">
                      <ShieldCheck size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Platform health
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl font-bold tracking-tight">
                      Your community is growing.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-indigo-100/80">
                      Keep an eye on new reports, user activity and successful
                      item recoveries from one place.
                    </p>

                    <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                      <span className="text-xs font-semibold text-white">
                        Admin session active
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Quick summary
                    </h2>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                            <Users size={17} />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            New users this week
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatNumber(stats.recent_users)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            <Package size={17} />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            New reports this week
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatNumber(stats.recent_reports)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            <CheckCircle2 size={17} />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            Resolved reports
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatNumber(stats.resolved_reports)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : !error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">
                Dashboard data is not available yet.
              </p>
              <button
                type="button"
                onClick={loadDashboard}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Reload dashboard
              </button>
            </div>
          ) : null}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200/80 py-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row">
            <p>
            © {currentYear ?? "2026"} CampusFind. All rights reserved.
            </p>
            <p>Administrator workspace</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
