
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
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  setIsLoggedIn(Boolean(localStorage.getItem("campusfind_token")));
}, []);

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
  }, [search, itemType, category]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-2xl text-white">
              ⌕
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                CampusFind
              </span>
              <span className="block text-xs text-slate-500">
                Lost something? Find it here.
              </span>
            </span>
          </Link>
          
            <div className="flex flex-wrap items-center gap-2">
  {isLoggedIn ? (
    <>
      <span className="px-3 py-2 text-sm font-medium text-gray-700">
        Logged in
      </span>

      <button
        onClick={() => {
          localStorage.removeItem("campusfind_token");
          setIsLoggedIn(false);
          router.refresh();
        }}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link
        href="/login"
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
      >
        Log in
      </Link>

      <Link
        href="/register"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Sign up
      </Link>
    </>
  )}

  <Link
    href="/report"
    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
  >
    + Report an item
  </Link>
</div>

        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
            Your campus. Connected.
          </p>

          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Lost something?
            <br />
            Let&apos;s find it.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
            A central place for students to report lost belongings,
            share found items, and help things find their way home.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#listings"
              className="rounded-xl bg-white px-6 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
            >
              Browse listings ↓
            </a>
            <Link
              href="/report"
              className="rounded-xl border border-blue-300/50 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Report a lost or found item
            </Link>
          </div>
        </div>
      </section>

      <section
        id="listings"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            The community board
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find what you&apos;re looking for
          </h2>
          <p className="mt-3 text-slate-600">
            Search recent reports or filter by the type of item.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Search listings
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. blue water bottle"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Item type
            </span>
            <select
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All items</option>
              <option value="lost">Lost items</option>
              <option value="found">Found items</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Recent listings</h3>
          {!loading && !error && (
            <span className="text-sm text-slate-500">
              {items.length} {items.length === 1 ? "item" : "items"} found
            </span>
          )}
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading listings…
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-bold text-red-800">
              Couldn&apos;t load listings
            </p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => {
                setSearch((value) => value);
                setItemType((value) => value);
                setCategory((value) => value);
              }}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="text-5xl">🔎</div>
            <h3 className="mt-4 text-xl font-bold">
              No matching listings yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              Try another search or category, or report an item to help
              the campus community.
            </p>
            <Link
              href="/report"
              className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Report an item
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">
                      {item.item_type === "lost" ? "🔍" : "🎒"}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        item.item_type === "lost"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.item_type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="mt-4 text-lg font-bold">{item.title}</h4>

                  <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  <p className="mt-4 text-sm text-slate-500">
                    <span aria-hidden="true">📍 </span>
                    {item.location}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-bold text-slate-800">CampusFind</p>
          <p>Helping campus belongings find their way home.</p>
        </div>
      </footer>
    </main>
  );
}
