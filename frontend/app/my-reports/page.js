
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const categories = [
  "Electronics",
  "Accessories",
  "Documents",
  "Clothing",
  "Bags",
  "Other",
];

const emptyForm = {
  title: "",
  description: "",
  category: "Electronics",
  location: "",
  item_type: "lost",
  image_url: "",
};

export default function MyReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadMyReports = useCallback(async () => {
    const token = localStorage.getItem("campusfind_token");

    if (!token) {
      setError("Please log in to view your reports.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/items/mine`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("campusfind_token");
        setError("Your session has expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.detail || "Could not load your reports.");
      }

      setItems(data);
      setError("");
    } catch (err) {
      setError(err.message || "Could not connect to CampusFind.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyReports();
  }, [loadMyReports]);

  function startEditing(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Other",
      location: item.location || "",
      item_type: item.item_type || "lost",
      image_url: item.image_url || "",
    });
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();

    const token = localStorage.getItem("campusfind_token");
    if (!token) {
      setError("Please log in again to edit your report.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      image_url: form.image_url.trim() || null,
    };

    try {
      const response = await fetch(
        `${API_BASE}/items/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("campusfind_token");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        const detail = data?.detail;
        const validationMessage = Array.isArray(detail)
          ? detail.map((issue) => issue.msg).join(", ")
          : detail;

        throw new Error(
          validationMessage || "Could not update your report."
        );
      }

      setEditingId(null);
      setForm(emptyForm);
      setMessage("Your report was updated successfully.");
      await loadMyReports();
    } catch (err) {
      setError(err.message || "Could not update your report.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("campusfind_token");
    if (!token) {
      setError("Please log in again to delete your report.");
      return;
    }

    setDeletingId(item.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/items/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("campusfind_token");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data?.detail || "Could not delete your report.");
      }

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id)
      );

      if (editingId === item.id) {
        setEditingId(null);
      }

      setMessage("Your report was deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete your report.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("campusfind_token");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            CampusFind
          </Link>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
              Home
            </Link>
            <Link href="/report" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
              Report an item
            </Link>
            <button onClick={handleLogout} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100">
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
            View and manage the lost and found items you have reported.
          </p>
        </div>

        {message && (
          <div role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            {error.toLowerCase().includes("log in") && (
              <Link href="/login" className="mt-2 inline-block font-semibold underline">
                Go to login →
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            Loading your reports...
          </div>
        ) : !error && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mb-4 text-4xl">📋</div>
            <h2 className="text-xl font-bold">No reports yet</h2>
            <p className="mt-2 text-slate-600">
              Your submitted reports will appear here.
            </p>
            <Link href="/report" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
              Create a report
            </Link>
          </div>
        ) : (
          !error && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  {items.length} {items.length === 1 ? "report" : "reports"}
                </p>
                <Link href="/report" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                  + New report
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-44 w-full bg-slate-100 object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-slate-100 text-4xl">
                        {item.item_type === "lost" ? "🔎" : "🎒"}
                      </div>
                    )}

                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.item_type === "lost" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                          {item.item_type === "lost" ? "Lost item" : "Found item"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.status || "open"}
                        </span>
                      </div>

                      {editingId === item.id ? (
                        <form onSubmit={handleSave} className="space-y-4">
                          <h2 className="text-lg font-bold">Edit report</h2>

                          <div>
                            <label htmlFor={`title-${item.id}`} className="mb-1 block text-sm font-medium">Item name</label>
                            <input id={`title-${item.id}`} name="title" value={form.title} onChange={handleChange} required minLength={3} maxLength={120} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </div>

                          <div>
                            <label htmlFor={`description-${item.id}`} className="mb-1 block text-sm font-medium">Description</label>
                            <textarea id={`description-${item.id}`} name="description" value={form.description} onChange={handleChange} required minLength={5} maxLength={2000} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </div>

                          <div>
                            <label htmlFor={`type-${item.id}`} className="mb-1 block text-sm font-medium">Report type</label>
                            <select id={`type-${item.id}`} name="item_type" value={form.item_type} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                              <option value="lost">Lost item</option>
                              <option value="found">Found item</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor={`category-${item.id}`} className="mb-1 block text-sm font-medium">Category</label>
                            <select id={`category-${item.id}`} name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                              {!categories.includes(form.category) && (
                                <option value={form.category}>{form.category}</option>
                              )}
                              {categories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor={`location-${item.id}`} className="mb-1 block text-sm font-medium">Campus location</label>
                            <input id={`location-${item.id}`} name="location" value={form.location} onChange={handleChange} required minLength={2} maxLength={120} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </div>

                          <div>
                            <label htmlFor={`image-${item.id}`} className="mb-1 block text-sm font-medium">Image URL (optional)</label>
                            <input id={`image-${item.id}`} name="image_url" type="url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/photo.jpg" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                              {saving ? "Saving..." : "Save changes"}
                            </button>
                            <button type="button" onClick={cancelEditing} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h2 className="text-lg font-bold">{item.title}</h2>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>

                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                            <p><strong className="text-slate-800">Category:</strong> {item.category}</p>
                            <p><strong className="text-slate-800">Location:</strong> {item.location}</p>
                            {item.created_at && (
                              <p><strong className="text-slate-800">Reported:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            <button type="button" onClick={() => startEditing(item)} className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">
                              {deletingId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )
        )}
      </section>
    </main>
  );
}
