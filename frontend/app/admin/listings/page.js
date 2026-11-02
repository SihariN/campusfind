
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  CalendarDays,
  Package,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getAdminProfile,
  getAdminListings,
  removeAdminListing,
} from "../../../lib/api";

const PAGE_SIZE = 10;

const statusStyles = {
  open: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  recovery_pending:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  resolved:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
};

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ListingImage({ src, itemType }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Package size={23} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${itemType || "Item"} listing`}
      onError={() => setImageError(true)}
      className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
    />
  );
}

function Sidebar({ mobileOpen, setMobileOpen, onLogout }) {
  const links = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Listings", href: "/admin/listings", icon: PackageSearch },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#10182b] text-white shadow-2xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.08] px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">
              C
            </div>
            <div>
              <p className="text-lg font-bold">
                CampusFind<span className="text-blue-400">.</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {links.map(({ label, href, icon: Icon }) => {
              const active = href === "/admin/listings";

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {label}
                </Link>
              );
            })}
          </nav>
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
              Administrator permissions are verified by the server.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
        statusStyles[status] ||
        "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

export default function AdminListingsPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const [selectedListing, setSelectedListing] = useState(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const [adminData, listingData] = await Promise.all([
        getAdminProfile(),
        getAdminListings({
          item_type: itemType,
          status,
          search,
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        }),
      ]);

      setAdmin(adminData);
      setListings(listingData.listings || []);
      setTotal(listingData.total || 0);
    } catch (err) {
      const message = err.message || "Could not load listings.";

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
  }, [router, itemType, status, search, page]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("campusfind_theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
  if (!actionSuccess) return;

  const timer = setTimeout(() => setActionSuccess(""), 4000);

  return () => clearTimeout(timer);
  }, [actionSuccess]);

  function openRemovalDialog(item) {
  setSelectedListing(item);
  setRemovalReason("");
  setActionError("");
}

function closeRemovalDialog() {
  if (removing) return;
  setSelectedListing(null);
  setRemovalReason("");
  setActionError("");
}

async function handleRemoveListing(event) {
  event.preventDefault();

  const cleanReason = removalReason.trim();

  if (cleanReason.length < 5) {
    setActionError("Please enter a reason with at least 5 characters.");
    return;
  }

  if (!selectedListing) return;

  setRemoving(true);
  setActionError("");

  try {
    await removeAdminListing(selectedListing.id, cleanReason);

    setListings((current) =>
      current.map((item) =>
        item.id === selectedListing.id
          ? {
              ...item,
              is_removed: true,
              removal_reason: cleanReason,
            }
          : item
      )
    );

    setActionSuccess(
      `"${selectedListing.title}" was removed successfully.`
    );

    setSelectedListing(null);
    setRemovalReason("");
  } catch (err) {
    setActionError(err.message || "Could not remove this listing.");
  } finally {
    setRemoving(false);
  }
}

  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";

    setTheme(next);
    localStorage.setItem("campusfind_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function logout() {
    localStorage.removeItem("campusfind_token");
    router.replace("/login");
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setItemType("");
    setStatus("");
    setPage(0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastItem = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={logout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/85 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Listing management
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                CampusFind / Listings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={changeTheme}
              aria-label="Toggle theme"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-bold text-slate-800 dark:text-white">
                {admin?.email || "Administrator"}
              </p>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Administrator
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
              {admin?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <PackageSearch size={13} />
                Content management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Listings
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Explore and monitor every lost and found report submitted to
                CampusFind.
              </p>
            </div>

            <button
              type="button"
              onClick={loadListings}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#17233d] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 sm:self-auto"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh listings
            </button>
          </div>

          {/* Summary cards */}
          <div className="mb-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                All listings
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Matching current filters
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Current page
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {listings.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Listings displayed
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Page
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {page + 1}
                <span className="ml-1 text-base font-medium text-slate-400">
                  / {totalPages}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {PAGE_SIZE} listings per page
              </p>
            </div>
          </div>

          {/* Filters */}
          <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal
                size={17}
                className="text-blue-600 dark:text-blue-400"
              />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Search and filters
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Search listings
                </span>
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search title, description or location..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </label>

              <FilterSelect
                label="Item type"
                value={itemType}
                onChange={(value) => {
                  setItemType(value);
                  setPage(0);
                }}
                options={[
                  { value: "", label: "All types" },
                  { value: "lost", label: "Lost items" },
                  { value: "found", label: "Found items" },
                ]}
              />

              <FilterSelect
                label="Report status"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(0);
                }}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "open", label: "Open" },
                  {
                    value: "recovery_pending",
                    label: "Recovery pending",
                  },
                  { value: "resolved", label: "Resolved" },
                ]}
              />

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
              <p className="font-bold">Unable to load listings</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={loadListings}
                className="mt-3 font-bold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  All reports
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Review submitted lost and found listings.
                </p>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Showing {firstItem}–{lastItem} of {total}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">
                  <SearchX size={28} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-white">
                  No listings found
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Try changing your search or filters to find the listings
                  you're looking for.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4">Listing</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Reported by</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-right">Details</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {listings.map((item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ListingImage
                                src={item.image_url}
                                itemType={item.item_type}
                              />
                              <div className="min-w-0 max-w-[220px]">
                                <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                                  {item.title}
                                </p>
                                <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
                                  <MapPin size={12} />
                                  {item.location || "Location unavailable"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                                item.item_type === "lost"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                              }`}
                            >
                              {item.item_type}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {item.category || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[160px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                              {item.owner_name || item.owner_email || "Unknown"}
                            </p>
                            {item.owner_name && item.owner_email && (
                              <p className="mt-1 max-w-[160px] truncate text-xs text-slate-400">
                                {item.owner_email}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Link
                                    href={`/items/${item.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-500/10"
                                >
                                    View
                                    <ExternalLink size={13} />
                                </Link>

                                {item.is_removed ? (
                                    <span className="rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    Removed
                                    </span>
                                ) : (
                                    <button
                                    type="button"
                                    onClick={() => openRemovalDialog(item)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                    <Trash2 size={13} />
                                    Remove
                                    </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-4 md:hidden">
                  {listings.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-start gap-3">
                        <ListingImage
                          src={item.image_url}
                          itemType={item.item_type}
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.category || "Uncategorized"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {item.item_type}
                            </span>
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                          <MapPin size={13} />
                          {item.location || "Location unavailable"}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays size={13} />
                          {formatDate(item.created_at)}
                        </p>
                        <p className="break-all">
                          Reported by:{" "}
                          {item.owner_name || item.owner_email || "Unknown"}
                        </p>
                      </div>

                      <Link
                        href={`/items/${item.id}`}
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        View listing
                        <ExternalLink size={13} />
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {!loading && total > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <strong>{firstItem}</strong> to{" "}
                  <strong>{lastItem}</strong> of <strong>{total}</strong>{" "}
                  listings
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((current) => current - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <span className="px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {page + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200/80 py-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row">
            <p>© {new Date().getFullYear()} CampusFind. All rights reserved.</p>
            <p>Administrator workspace</p>
          </footer>
        </main>
      </div>
      {selectedListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle size={21} />
                </div>

                <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Remove this listing?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedListing.title}
                </p>
                </div>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                The listing will be hidden from public users, but its record will
                remain available to administrators.
            </p>

            <form onSubmit={handleRemoveListing} className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Reason for removal
                <textarea
                    value={removalReason}
                    onChange={(event) => setRemovalReason(event.target.value)}
                    rows={4}
                    maxLength={500}
                    required
                    placeholder="Explain why this listing is being removed..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                </label>

                <p className="mt-1 text-right text-xs text-slate-400">
                {removalReason.length}/500 characters · minimum 5
                </p>

                {actionError && (
                <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
                    {actionError}
                </p>
                )}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={closeRemovalDialog}
                    disabled={removing}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:text-slate-300"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={removing || removalReason.trim().length < 5}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                    {removing ? "Removing..." : (
                    <>
                        <Trash2 size={15} />
                        Confirm removal
                    </>
                    )}
                </button>
                </div>
            </form>
            </section>
        </div>
        )}
    </div>
  );
}
