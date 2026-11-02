
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

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.box}
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/25 transition group-hover:rotate-3 group-hover:scale-105">
        C
      </span>
      <span>
        <span className="block text-xl font-black tracking-tight text-slate-950 dark:text-white">
          CampusFind<span className="text-blue-600">.</span>
        </span>
        <span className="block text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
          YOUR CAMPUS LOST & FOUND
        </span>
      </span>
    </Link>
  );
}

function BadgeCount({ count }) {
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("campusfind_token");
    let cancelled = false;

    setIsLoggedIn(Boolean(token));

    async function verifyAdminAccess() {
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        await getAdminProfile();
        if (!cancelled) setIsAdmin(true);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    verifyAdminAccess();

    const savedTheme = localStorage.getItem("campusfind_theme");
    setTheme(savedTheme === "dark" ? "dark" : "light");

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("campusfind_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const messages = await getInbox();
        if (!cancelled) {
          setUnreadCount(messages.filter((message) => !message.is_read).length);
        }
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    }

    loadUnreadCount();
    window.addEventListener("focus", loadUnreadCount);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadUnreadCount);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;

    async function loadNotificationCount() {
      try {
        const data = await getUnreadNotificationCount();
        if (!cancelled) {
          setUnreadNotificationCount(data.unread_count || 0);
        }
      } catch {
        if (!cancelled) setUnreadNotificationCount(0);
      }
    }

    loadNotificationCount();
    window.addEventListener("focus", loadNotificationCount);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadNotificationCount);
    };
  }, [isLoggedIn]);

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
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
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

  function logout() {
    localStorage.removeItem("campusfind_token");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setProfileMenuOpen(false);
    setAdminMenuOpen(false);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Brand />

          <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-end gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/my-reports" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                  My Reports
                </Link>

                <Link href="/notifications" aria-label={`Notifications, ${unreadNotificationCount} unread`} className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                  <Icon name="bell" className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  <BadgeCount count={unreadNotificationCount} />
                </Link>

                <Link href="/messages/inbox" aria-label={`Messages, ${unreadCount} unread`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                  <Icon name="mail" className="h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                  <BadgeCount count={unreadCount} />
                </Link>

                {isAdmin && (
                  <div className="relative">
                    <button type="button" onClick={() => { setAdminMenuOpen(!adminMenuOpen); setProfileMenuOpen(false); }} aria-expanded={adminMenuOpen} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                      <Icon name="shield" className="h-4 w-4" />
                      <span>Admin</span>
                    </button>
                    {adminMenuOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <Link href="/admin" onClick={() => setAdminMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                          Admin dashboard
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <button type="button" onClick={() => { setProfileMenuOpen(!profileMenuOpen); setAdminMenuOpen(false); }} aria-expanded={profileMenuOpen} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                    <Icon name="user" className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                        My profile
                      </Link>
                      <button type="button" onClick={logout} className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">
                  Log in
                </Link>
                <Link href="/register" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                  Create account <span aria-hidden="true">↗</span>
                </Link>
              </>
            )}

            <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#08142f] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              Made for your campus
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Lost something?
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                Find your way back.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              The campus lost-and-found community. Discover reported items,
              share what you have found, and help belongings get back to their owners.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#listings" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400">
                Explore listings <span aria-hidden="true">↓</span>
              </a>
              <Link href={isLoggedIn ? "/report" : "/login"} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <Icon name="plus" className="h-4 w-4" />
                Report an item
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-emerald-400" /> Community-powered</span>
              <span className="inline-flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-emerald-400" /> Easy to search</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-indigo-500/10 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">The community board</p>
                  <h2 className="mt-2 text-xl font-extrabold">Every item has a story.</h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                  <Icon name="box" className="h-6 w-6" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-2xl">🔎</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">Lost something?</span>
                    <p className="mt-1 text-sm font-semibold text-white">Search reported items</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Find details that match what you lost.</p>
                  </div>
                  <Icon name="arrow" className="h-4 w-4 shrink-0 text-slate-500" />
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">🎒</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Found something?</span>
                    <p className="mt-1 text-sm font-semibold text-white">Help it find its owner</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Submit a report for your campus community.</p>
                  </div>
                  <Icon name="arrow" className="h-4 w-4 shrink-0 text-slate-500" />
                </div>
              </div>

              <a href="#listings" className="mt-5 flex items-center justify-between rounded-xl bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 transition hover:bg-blue-500/20">
                Browse the community board <span aria-hidden="true">→</span>
              </a>
            </div>
            
          </div>
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="scroll-mt-24 bg-slate-50/80 px-5 py-16 dark:bg-slate-950 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Discover & reconnect</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Explore the listings<span className="text-blue-600">.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                Search recent campus reports and narrow the results to find the details you need.
              </p>
            </div>
            <Link href={isLoggedIn ? "/report" : "/login"} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:text-blue-300 md:self-auto">
              <Icon name="plus" className="h-4 w-4" /> Submit a report
            </Link>
          </div>

          {/* Search and filters */}
          <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr_0.9fr_auto] lg:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search items</span>
                <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-800">
                  <Icon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “blue water bottle”" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" />
                  {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><Icon name="close" className="h-4 w-4" /></button>}
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Item status</span>
                <select value={itemType} onChange={(event) => setItemType(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <option value="">All items</option>
                  <option value="lost">Lost items</option>
                  <option value="found">Found items</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <option value="">All categories</option>
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>

              {(search || itemType || category) && (
                <button type="button" onClick={clearFilters} className="h-12 rounded-xl px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800">
                  Clear filters
                </button>
              )}
            </div>

            {(search || itemType || category) && (
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your results update automatically as you change the filters.</p>
              </div>
            )}
          </div>

          {/* Results heading */}
          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Recent reports</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Items shared by your campus community</p>
            </div>
            {!loading && !error && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {items.length} {items.length === 1 ? "result" : "results"}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div role="status" className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((number) => (
                <div key={number} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="h-52 bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading listings…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/40">
              <h3 className="font-bold text-rose-900 dark:text-rose-200">Couldn’t load listings</h3>
              <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-300">{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700">Try again</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><Icon name="search" className="h-7 w-7" /></span>
              <h3 className="mt-5 text-xl font-extrabold">No matching reports</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">Try another search or remove a filter. You can also submit a report to help your campus community.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Clear filters</button>
                <Link href={isLoggedIn ? "/report" : "/login"} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Report an item</Link>
              </div>
            </div>
          )}

          {/* Listing cards */}
          {!loading && !error && items.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-900/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-black/30">
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-blue-300 dark:text-slate-600">
                        <Icon name="box" className="h-12 w-12" />
                        <span className="text-xs font-bold uppercase tracking-[0.18em]">No image provided</span>
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm ${item.item_type === "lost" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {item.item_type === "lost" ? "Lost item" : "Found item"}
                    </span>
                    <span className="absolute right-3 top-3 rounded-lg border border-white/50 bg-white/90 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="break-words text-lg font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {item.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 min-h-[4.5rem] break-words text-sm leading-6 text-slate-600 dark:text-slate-400 [overflow-wrap:anywhere]">
                      {item.description || "No description provided."}
                    </p>

                    <div className="mt-auto pt-5">
                      <div className="flex items-start gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <span className="break-words [overflow-wrap:anywhere]">{item.location || "Location not specified"}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-medium text-slate-400">
                          {item.created_at ? `Reported ${new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}` : "Community report"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition group-hover:gap-2 dark:text-blue-400">
                          View details <Icon name="arrow" className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <p className="text-sm text-slate-500 dark:text-slate-400">Helping campus belongings find their way home.</p>
          <a href="#listings" className="text-sm font-bold text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Back to listings ↑</a>
        </div>
      </footer>
    </main>
  );
}
