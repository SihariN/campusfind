
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getItems,
  getInbox,
  getUnreadNotificationCount,
  getAdminProfile,
} from "../lib/api";

const categories = [
  "Electronics",
  "Accessories",
  "Documents",
  "Clothing",
  "Bags",
  "Other",
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Load saved login and theme preferences.
  useEffect(() => {
  const token = localStorage.getItem("campusfind_token");

  setIsLoggedIn(Boolean(token));

  let cancelled = false;

  async function verifyAdminAccess() {
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      await getAdminProfile();

      if (!cancelled) {
        setIsAdmin(true);
      }
    } catch (error) {
      if (!cancelled) {
        setIsAdmin(false);
      }
    }
  }

  verifyAdminAccess();

  const savedTheme = localStorage.getItem("campusfind_theme");
  setTheme(savedTheme === "dark" ? "dark" : "light");

  return () => {
    cancelled = true;
  };
  }, []);

  // Apply the selected theme to the entire page.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("campusfind_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }
  useEffect(() => {
  if (!isLoggedIn) {
    setUnreadCount(0);
    return;
  }

  let cancelled = false;

  const loadUnreadCount = async () => {
    try {
      const messages = await getInbox();

      if (!cancelled) {
        setUnreadCount(
          messages.filter((message) => !message.is_read).length
        );
      }
    } catch (error) {
      if (!cancelled) {
        setUnreadCount(0);
      }
    }
  };

  loadUnreadCount();

  window.addEventListener("focus", loadUnreadCount);

  return () => {
    cancelled = true;
    window.removeEventListener("focus", loadUnreadCount);
  };
}, [isLoggedIn]);

// Load unread notification count.
useEffect(() => {
  if (!isLoggedIn) {
    setUnreadNotificationCount(0);
    return;
  }

  let cancelled = false;

  const loadNotificationCount = async () => {
    try {
      const data = await getUnreadNotificationCount();

      if (!cancelled) {
        setUnreadNotificationCount(data.unread_count || 0);
      }
    } catch (error) {
      if (!cancelled) {
        setUnreadNotificationCount(0);
      }
    }
  };

  loadNotificationCount();

  window.addEventListener("focus", loadNotificationCount);

  return () => {
    cancelled = true;
    window.removeEventListener("focus", loadNotificationCount);
  };
}, [isLoggedIn]);


  // Load and filter listings.
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError("");

      try {
        const data = await getItems({
          search: search.trim(),
          item_type: itemType,
          category,
        });

        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(loadItems, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, itemType, category, reloadKey]);

  function clearFilters() {
    setSearch("");
    setItemType("");
    setCategory("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-700 to-indigo-800 text-2xl font-black text-white shadow-lg shadow-blue-700/25">
              C
            </span>

            <span>
              <span className="block text-xl font-black tracking-tight text-slate-950 dark:text-white">
                CampusFind<span className="text-blue-600 dark:text-blue-400">.</span>
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Lost something? Find it here.
              </span>
            </span>
          </Link>

          {/* Navigation links */}
          <nav
            aria-label="Main navigation"
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end"
          >
            {isLoggedIn ? (
              <>
                <Link
                  href="/my-reports"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  My Reports
                </Link>

                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>🔔</span>
                  <span>Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/messages/inbox"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>✉️</span>
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Admin dropdown */}
                {isAdmin && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminMenuOpen((open) => !open);
                        setProfileMenuOpen(false);
                      }}
                      aria-expanded={adminMenuOpen}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-bold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    >
                      <span>🛡️</span>
                      <span>Admin</span>
                      <span className="text-xs"> </span>
                    </button>

                    {adminMenuOpen && (
                      <div className="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                        <Link
                          href="/admin"
                          onClick={() => setAdminMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
                        >
                          <span>📊</span>
                          Admin Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen((open) => !open);
                      setAdminMenuOpen(false);
                    }}
                    aria-expanded={profileMenuOpen}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span>👤</span>
                    <span>Account</span>
                    <span className="text-xs"> </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>👤</span>
                        My Profile
                      </Link>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("campusfind_token");
                          setIsLoggedIn(false);
                          setIsAdmin(false);
                          setProfileMenuOpen(false);
                          setAdminMenuOpen(false);
                          router.refresh();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <span>↪</span>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your campus community, connected
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              Lost something?
              <br />
              <span className="text-blue-300">Let&apos;s find it.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100/85 sm:text-lg">
              Lost belongings shouldn't stay lost. Discover reported items,
              connect with your campus community, and help belongings find
              their way back to the people who need them.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#listings"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-bold text-blue-900 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore listings ↓
              </a>

              <Link
                href="/report"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Report an item
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
                How CampusFind works
              </p>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/15 text-xl">
                    🔎
                  </span>
                  <div>
                    <h2 className="font-bold">Lost something?</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Browse reports or publish details about your missing item.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-xl">
                    🎒
                  </span>
                  <div>
                    <h2 className="font-bold">Found something?</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Share what you found so its owner can look for it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/15 text-xl">
                    🤝
                  </span>
                  <div>
                    <h2 className="font-bold">Help your campus</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Make it easier for the community to reconnect with belongings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section
        id="listings"
        className="mx-auto max-w-7xl px-5 py-14 transition-colors duration-300 sm:px-8 sm:py-20"
      >
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            The community board
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Find what you&apos;re looking for
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
            Search recent reports and narrow down the results by item type
            or category.
          </p>
        </div>

        {/* Search and filters */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.02] transition-colors duration-300 sm:p-7 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 dark:ring-white/[0.03]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Search listings
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try “blue water bottle”"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Item type
              </span>
              <select
                value={itemType}
                onChange={(event) => setItemType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
              >
                <option value="">All items</option>
                <option value="lost">Lost items</option>
                <option value="found">Found items</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
              >
                <option value="">All categories</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(search || itemType || category) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Filters are active. Refine your search or clear them.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800"
              >
                Clear filters ×
              </button>
            </div>
          )}
        </div>

        {/* Listing heading */}
        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold">Recent listings</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Community-reported lost and found items
            </p>
          </div>

          {!loading && !error && (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {items.length} {items.length === 1 ? "result" : "results"}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div
            role="status"
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="h-44 bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading listings…</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950"
          >
            <h3 className="font-bold text-red-900 dark:text-red-200">
              Couldn&apos;t load listings
            </h3>
            <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950">
              🔎
            </div>
            <h3 className="mt-5 text-xl font-extrabold">
              No matching listings yet
            </h3>
            <p className="mx-auto mt-2 max-w-md leading-7 text-slate-600 dark:text-slate-400">
              Try a different search or category. If you have information
              about a missing or found item, you can add a report.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>
              <Link
                href="/report"
                className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
              >
                Report an item
              </Link>
            </div>
          </div>
        )}

        {/* Listing cards */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/[0.08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-black/30"
            >
                <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-6xl" aria-hidden="true">
                      {item.item_type === "lost" ? "🔎" : "🎒"}
                    </span>
                  )}

                  <span
                    className={`absolute left-3 top-3 rounded-full border border-white/50 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider shadow-md backdrop-blur-sm ${
                      item.item_type === "lost"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.item_type === "lost" ? "Lost item" : "Found item"}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="mt-4 break-words text-xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white">
                    {item.title}
                  </h4>

                  <p className="mt-3 min-h-[4.5rem] break-words text-sm leading-7 text-slate-600 dark:text-slate-300 [overflow-wrap:anywhere]">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <span aria-hidden="true">📍</span>
                    <span className="break-words [overflow-wrap:anywhere]">
                      {item.location}
                    </span>
                  </div>

                  {item.created_at && (
                    <p className="mt-3 text-xs font-medium text-slate-400">
                      Reported{" "}
                      {new Date(item.created_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link
            href="/"
            className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
          >
            CampusFind
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Helping campus belongings find their way home.
          </p>
          <a
            href="#listings"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Browse listings ↑
          </a>
        </div>
      </footer>
    </main>
  );
}
