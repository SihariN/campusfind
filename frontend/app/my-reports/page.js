
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400";

const secondaryButtonClass =
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700";

export default function MyReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [notificationVersion, setNotificationVersion] = useState(0);

  const showMessage = useCallback((text) => {
    setMessage(text);
    setNotificationVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message, notificationVersion]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

    setSelectedImage(null);
    setImagePreview(item.image_url || "");
    setRemoveImage(false);
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedImage(null);
    setImagePreview("");
    setRemoveImage(false);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview("");
    setRemoveImage(true);
    setError("");
  }

  async function uploadSelectedImage(token) {
    const imageData = new FormData();
    imageData.append("file", selectedImage);

    setUploadingImage(true);

    try {
      const response = await fetch(`${API_BASE}/uploads/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: imageData,
      });

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
          validationMessage || "Could not upload the image."
        );
      }

      if (!data?.image_url) {
        throw new Error("The upload did not return an image URL.");
      }

      return data.image_url;
    } finally {
      setUploadingImage(false);
    }
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

    try {
      let imageUrl = form.image_url || null;

      if (removeImage) {
        imageUrl = null;
      } else if (selectedImage) {
        imageUrl = await uploadSelectedImage(token);
      }

      const payload = {
        ...form,
        image_url: imageUrl,
      };

      const response = await fetch(`${API_BASE}/items/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
      setSelectedImage(null);
      setImagePreview("");
      setRemoveImage(false);

      showMessage("Your report was updated successfully.");
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
        cancelEditing();
      }

      showMessage("Your report was deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete your report.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(item) {
    const nextStatus =
      item.status === "resolved" ? "open" : "resolved";

    const actionMessage =
      nextStatus === "resolved"
        ? item.item_type === "lost"
          ? "mark this item as returned"
          : "mark this item as claimed"
        : "reopen this report";

    if (!window.confirm(`Are you sure you want to ${actionMessage}?`)) {
      return;
    }

    const token = localStorage.getItem("campusfind_token");

    if (!token) {
      setError("Please log in again to update your report.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/items/${item.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("campusfind_token");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not update the report status."
        );
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: data.status }
            : entry
        )
      );

      showMessage(
        nextStatus === "resolved"
          ? "Report marked as resolved successfully."
          : "Report reopened successfully."
      );
    } catch (err) {
      setError(err.message || "Could not update the report status.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("campusfind_token");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Your CampusFind activity
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Reports
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
            View and manage the lost and found items you have reported.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 transition-colors dark:border-green-800 dark:bg-green-950/50 dark:text-green-300"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 transition-colors dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          >
            <p>{error}</p>

            {error.toLowerCase().includes("log in") && (
              <Link
                href="/login"
                className="mt-2 inline-block font-semibold underline"
              >
                Go to login →
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Loading your reports...
          </div>
        ) : !error && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 text-4xl">📋</div>

            <h2 className="text-xl font-bold">No reports yet</h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Your submitted reports will appear here.
            </p>

            <Link
              href="/report"
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Create a report
            </Link>
          </div>
        ) : (
          !error && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {items.length} {items.length === 1 ? "report" : "reports"}
                </p>

                <Link
                  href="/report"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  + New report
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Link
                      href={`/items/${item.id}`}
                      className="block cursor-pointer"
                      aria-label={`View details for ${item.title}`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-44 w-full bg-slate-100 object-cover transition-transform duration-300 hover:scale-[1.02] dark:bg-slate-800"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-slate-100 text-4xl dark:bg-slate-800">
                          {item.item_type === "lost" ? "🔎" : "🎒"}
                        </div>
                      )}
                    </Link>

                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.item_type === "lost"
                              ? "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                              : "bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300"
                          }`}
                        >
                          {item.item_type === "lost"
                            ? "Lost item"
                            : "Found item"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                              : item.status === "recovery_pending"
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {(item.status || "open")
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                        </span>
                      </div>

                      {editingId === item.id ? (
                        <form onSubmit={handleSave} className="space-y-4">
                          <h2 className="text-lg font-bold">Edit report</h2>

                          <div>
                            <label
                              htmlFor={`title-${item.id}`}
                              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Item name
                            </label>

                            <input
                              id={`title-${item.id}`}
                              name="title"
                              value={form.title}
                              onChange={handleChange}
                              required
                              minLength={3}
                              maxLength={120}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`description-${item.id}`}
                              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Description
                            </label>

                            <textarea
                              id={`description-${item.id}`}
                              name="description"
                              value={form.description}
                              onChange={handleChange}
                              required
                              minLength={5}
                              maxLength={2000}
                              rows={3}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`type-${item.id}`}
                              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Report type
                            </label>

                            <select
                              id={`type-${item.id}`}
                              name="item_type"
                              value={form.item_type}
                              onChange={handleChange}
                              className={inputClass}
                            >
                              <option value="lost">Lost item</option>
                              <option value="found">Found item</option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`category-${item.id}`}
                              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Category
                            </label>

                            <select
                              id={`category-${item.id}`}
                              name="category"
                              value={form.category}
                              onChange={handleChange}
                              className={inputClass}
                            >
                              {!categories.includes(form.category) && (
                                <option value={form.category}>
                                  {form.category}
                                </option>
                              )}

                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`location-${item.id}`}
                              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Campus location
                            </label>

                            <input
                              id={`location-${item.id}`}
                              name="location"
                              value={form.location}
                              onChange={handleChange}
                              required
                              minLength={2}
                              maxLength={120}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`image-${item.id}`}
                              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              Report image (optional)
                            </label>

                            {imagePreview ? (
                              <div className="space-y-3">
                                <img
                                  src={imagePreview}
                                  alt="Selected report preview"
                                  className="h-44 w-full rounded-xl border border-slate-200 bg-slate-100 object-contain dark:border-slate-700 dark:bg-slate-800"
                                />

                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  disabled={saving}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
                                >
                                  Remove image
                                </button>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  No image selected.
                                </p>
                              </div>
                            )}

                            <label
                              htmlFor={`image-${item.id}`}
                              className="mt-3 inline-flex cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {selectedImage
                                ? "Choose another image"
                                : imagePreview
                                  ? "Replace image"
                                  : "Upload an image"}
                            </label>

                            <input
                              id={`image-${item.id}`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageChange}
                              disabled={saving}
                              className="sr-only"
                            />

                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              JPEG, PNG or WebP. Maximum file size: 5 MB.
                              Your changes take effect when you save the report.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                            >
                              {uploadingImage
                                ? "Uploading image..."
                                : saving
                                  ? "Saving..."
                                  : "Save changes"}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={saving}
                              className={`${secondaryButtonClass} disabled:opacity-60`}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/items/${item.id}`}
                              className="min-w-0 text-lg font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {item.title}
                            </Link>

                            <Link
                              href={`/items/${item.id}`}
                              className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              View details →
                            </Link>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {item.description}
                          </p>

                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            <p>
                              <strong className="text-slate-800 dark:text-slate-100">
                                Category:
                              </strong>{" "}
                              {item.category}
                            </p>

                            <p>
                              <strong className="text-slate-800 dark:text-slate-100">
                                Location:
                              </strong>{" "}
                              {item.location}
                            </p>

                            {item.created_at && (
                              <p>
                                <strong className="text-slate-800 dark:text-slate-100">
                                  Reported:
                                </strong>{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item)}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                item.status === "resolved"
                                  ? "bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:outline-amber-500 dark:bg-amber-400/15 dark:text-amber-300 dark:hover:bg-amber-400/25 dark:focus-visible:outline-amber-400"
                                  : "bg-green-50 text-green-800 hover:bg-green-100 focus-visible:outline-green-500 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 dark:focus-visible:outline-emerald-400"
                              }`}
                            >
                              {item.status === "resolved"
                                ? "Reopen"
                                : "Mark resolved"}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25 dark:focus-visible:outline-blue-400"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:bg-red-400/15 dark:text-red-300 dark:hover:bg-red-400/25 dark:focus-visible:outline-red-400"
                            >
                              {deletingId === item.id
                                ? "Deleting..."
                                : "Delete"}
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

