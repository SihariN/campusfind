
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  ShieldCheck,
  UserRound,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  CalendarDays,
  AlertCircle,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

import { getAdminProfile, getAdminUsers, updateAdminUserRole } from "../../../lib/api";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name, email) {
  const source = name?.trim() || email || "U";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Sidebar({ onNavigate }) {
  const links = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Listings", href: "/admin/listings", icon: FileText },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-20 items-center gap-3 border-b border-gray-200 px-6 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ShieldCheck size={21} />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            CampusFind
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Administration
          </p>
        </div>
      </div>

      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {links.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin/users";

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-200 p-4 dark:border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to CampusFind
        </Link>
      </div>
    </aside>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
            {description}
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      await getAdminProfile();

      const data = await getAdminUsers({
        skip,
        limit: PAGE_SIZE,
        search,
        role,
      });

      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      const message = err.message || "Unable to load users.";

      if (
        message.toLowerCase().includes("administrator") ||
        message.includes("403") ||
        message.includes("401")
      ) {
        window.location.href = "/";
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [skip, search, role]);

  async function handleUserRoleUpdate(user) {
  const newRole = user.role === "admin" ? "user" : "admin";

  const confirmed = window.confirm(
    `Are you sure you want to ${
      newRole === "admin" ? "promote" : "demote"
    } ${user.full_name || user.email}?`
  );

  if (!confirmed) return;

  setUpdatingUserId(user.id);
  setActionError("");
  setActionSuccess("");

  try {
    await updateAdminUserRole(user.id, newRole);

    setActionSuccess(
      `${user.email} is now ${newRole === "admin" ? "an administrator" : "a regular user"}.`
    );

    await loadUsers();
  } catch (err) {
    setActionError(err.message || "Could not update user role.");
  } finally {
    setUpdatingUserId(null);
  }
}

useEffect(() => {
  if (!actionSuccess) return;

  const timer = setTimeout(() => {
    setActionSuccess("");
  }, 4000);

  return () => clearTimeout(timer);
}, [actionSuccess]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(event) {
    event.preventDefault();
    setSkip(0);
    setSearch(searchInput.trim());
  }

  function handleRoleFilterChange(event) {
  setSkip(0);
  setRole(event.target.value);
}

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setRole("");
    setSkip(0);
  }

  const adminCount = users.filter((user) => user.role === "admin").length;
  const regularCount = users.filter((user) => user.role === "user").length;
  const reportCount = users.reduce(
    (sum, user) => sum + (user.total_reports || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <div className="hidden w-64 shrink-0 md:block">
          <Sidebar />
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="relative h-full w-72 max-w-[85%]">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-6 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  User Management
                </p>
                <p className="hidden text-xs text-gray-500 dark:text-slate-400 sm:block">
                  Manage and monitor registered accounts
                </p>
              </div>
            </div>

            <button
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-7 lg:p-10">
            <section>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Administration / Users
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Users
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
                View registered CampusFind accounts, account roles, and their
                reporting activity.
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total registered users"
                value={total}
                description="Accounts matching current filters"
                icon={Users}
              />
              <StatCard
                title="Administrators"
                value={adminCount}
                description="On this page"
                icon={ShieldCheck}
              />
              <StatCard
                title="Regular users"
                value={regularCount}
                description="On this page"
                icon={UserRound}
              />
              <StatCard
                title="Reports by listed users"
                value={reportCount}
                description="Combined reports on this page"
                icon={FileText}
              />
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {actionSuccess && (
                <div className="mx-5 mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                    {actionSuccess}
                </div>
                )}

                {actionError && (
                <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {actionError}
                </div>
                )}
              <div className="border-b border-gray-200 p-5 dark:border-slate-800 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      Registered accounts
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {total} account{total === 1 ? "" : "s"} found
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <form
                      onSubmit={handleSearch}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-slate-700 dark:bg-slate-950 sm:w-72"
                    >
                      <Search
                        size={17}
                        className="shrink-0 text-gray-400 dark:text-slate-500"
                      />
                      <input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search name or email..."
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-slate-600"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Search
                      </button>
                    </form>

                    <select
                      value={role}
                      onChange={handleRoleFilterChange}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <option value="">All roles</option>
                      <option value="user">Regular users</option>
                      <option value="admin">Administrators</option>
                    </select>

                    {(search || role) && (
                      <button
                        onClick={clearFilters}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Could not load users</p>
                    <p className="mt-1">{error}</p>
                    <button
                      onClick={loadUsers}
                      className="mt-2 font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : !error && users.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <div className="rounded-2xl bg-gray-100 p-4 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                    <Users size={28} />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                    No users found
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-slate-400">
                    Try changing your search or role filter.
                  </p>
                  {(search || role) && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : !error ? (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-slate-950/70 dark:text-slate-500">
                        <tr>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Reports</th>
                          <th className="px-6 py-4">Joined</th>
                          <th className="px-6 py-4">Account ID</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-gray-50/80 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {user.profile_picture_url ? (
                                  <img
                                    src={user.profile_picture_url}
                                    alt=""
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                    {initials(user.full_name, user.email)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {user.full_name || "Unnamed user"}
                                  </p>
                                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-slate-400">
                                    <Mail size={12} />
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {user.role === "admin" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                                  <ShieldCheck size={13} />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                  <UserRound size={13} />
                                  User
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user.total_reports ?? 0}
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-500">
                                {user.lost_reports ?? 0} lost ·{" "}
                                {user.found_reports ?? 0} found
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays
                                  size={14}
                                  className="text-gray-400"
                                />
                                {formatDate(user.created_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-500">
                              #{user.id}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => handleUserRoleUpdate(user)}
                                    disabled={updatingUserId === user.id}
                                    className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                                >
                                    {updatingUserId === user.id
                                    ? "Updating..."
                                    : user.role === "admin"
                                        ? "Demote"
                                        : "Promote"}
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-slate-800 md:hidden">
                    {users.map((user) => (
                      <div key={user.id} className="space-y-4 p-5">
                        <div className="flex items-center gap-3">
                          {user.profile_picture_url ? (
                            <img
                              src={user.profile_picture_url}
                              alt=""
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                              {initials(user.full_name, user.email)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {user.full_name || "Unnamed user"}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                          {user.role === "admin" ? (
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                              Admin
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                              User
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-slate-950">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-500">
                              Total reports
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {user.total_reports ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-500">
                              Joined
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(user.created_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-500">
                              Lost reports
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-300">
                              {user.lost_reports ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-500">
                              Found reports
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-300">
                              {user.found_reports ?? 0}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 dark:text-slate-600">
                          Account ID: #{user.id}
                        </p>
                        <button
                            onClick={() => handleRoleChange(user)}
                            disabled={updatingUserId === user.id}
                            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                            >
                            {updatingUserId === user.id
                                ? "Updating..."
                                : user.role === "admin"
                                ? "Demote administrator"
                                : "Promote to administrator"}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Showing {skip + 1}–
                      {Math.min(skip + users.length, total)} of {total} users
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSkip(Math.max(0, skip - PAGE_SIZE))
                        }
                        disabled={skip === 0}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <span className="px-2 text-xs font-medium text-gray-500 dark:text-slate-400">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setSkip(skip + PAGE_SIZE)}
                        disabled={currentPage >= totalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            <p className="text-center text-xs text-gray-400 dark:text-slate-600">
              CampusFind Administration · User accounts
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
