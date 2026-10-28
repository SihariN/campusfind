"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function MyReportsPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyReports() {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        setError("Please log in to view your reports.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/items/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          localStorage.removeItem("campusfind_token");
          setError("Your session has expired. Please log in again.");
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof data?.detail === "string"
              ? data.detail
              : "Could not load your reports. Please try again."
          );
        }

        setItems(data);
      } catch (err) {
        setError(
          err.message ||
            "Unable to connect to CampusFind. Check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMyReports();
  }, []);

  function handleLogout() {
    localStorage.removeItem("campusfind_token");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-blue-700"
          >
            CampusFind
          </Link>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
            >
              Home
            </Link>
            <Link
              href="/report"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
            >
              Report an item
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Your CampusFind activity
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Reports
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            View the lost and found items you have reported to the campus
            community.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-medium text-slate-700">
              Loading your reports...
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <p className="font-medium text-red-800">{error}</p>

            {error.toLowerCase().includes("log in") && (
              <Link
                href="/login"
                className="mt-4 inline-block font-semibold text-blue-700 underline"
              >
                Go to login →
              </Link>
            )}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mb-4 text-4xl" aria-hidden="true">
              📋
            </div>
            <h2 className="text-xl font-bold">No reports yet</h2>
            <p className="mx-auto mt-2 max-w-md leading-6 text-slate-600">
              You haven't reported any lost or found items yet. Your reports
              will appear here after you submit them.
            </p>
            <Link
              href="/report"
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Create your first report
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                You have{" "}
                <span className="font-bold text-slate-900">
                  {items.length}
                </span>{" "}
                {items.length === 1 ? "report" : "reports"}.
              </p>

              <Link
                href="/report"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                + New report
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-48 w-full bg-slate-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-4xl">
                      {item.item_type === "lost" ? "🔎" : "🎒"}
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.item_type === "lost"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {item.item_type === "lost"
                          ? "Lost item"
                          : "Found item"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                        {item.status || "open"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold">{item.title}</h2>

                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Category:
                        </span>{" "}
                        {item.category}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Location:
                        </span>{" "}
                        {item.location}
                      </p>
                      {item.created_at && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Reported:
                          </span>{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/items/${item.id}`}
                      className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View listing →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
