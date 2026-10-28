
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getItems } from "../lib/api";

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
  const [theme, setTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const router = useRouter();

  // Load saved login and theme preferences.
  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("campusfind_token")));

    const savedTheme = localStorage.getItem("campusfind_theme");
    setTheme(savedTheme === "dark" ? "dark" : "light");
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
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white shadow-sm">
              C
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                CampusFind
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Lost something? Find it here.
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {isLoggedIn ? (
              <>
                <Link
                  href="/my-reports"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  My Reports
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("campusfind_token");
                    setIsLoggedIn(false);
                    router.refresh();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 border border-gray-300 dark:border-gray-600"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-slate-800"
                >
                  Sign up
                </Link>
              </>
            )}

            <Link
              href="/report"
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              + Report item
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white">
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

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Lost something?
              <br />
              <span className="text-blue-300">Let&apos;s find it.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              A shared space for students to report lost belongings,
              share found items, and help important things find their
              way home.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#listings"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400"
              >
                Explore listings ↓
              </a>

              <Link
                href="/report"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
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
        className="mx-auto max-w-7xl px-5 py-12 transition-colors duration-300 sm:px-8 sm:py-16"
      >
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            The community board
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find what you&apos;re looking for
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
            Search recent reports and narrow down the results by item type
            or category.
          </p>
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Item type
              </span>
              <select
                value={itemType}
                onChange={(event) => setItemType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
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
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-700">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-6xl" aria-hidden="true">
                      {item.item_type === "lost" ? "🔎" : "🎒"}
                    </span>
                  )}

                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide shadow-sm ${
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
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="mt-3 break-words text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>

                  <p className="mt-2 min-h-[4.5rem] break-words text-sm leading-6 text-slate-600 dark:text-slate-300 [overflow-wrap:anywhere]">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
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
              </article>
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
