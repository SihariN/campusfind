
"use client";

import { useState } from "react";
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

export default function ReportPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electronics",
    location: "",
    item_type: "lost",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      image_url: form.image_url.trim() || null,
    };

    try {
      const response = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail;
        const message = Array.isArray(detail)
          ? detail.map((issue) => issue.msg).join(", ")
          : typeof detail === "string"
            ? detail
            : "Could not submit your report.";

        throw new Error(message);
      }

      setSuccess(
        `Your ${data.item_type} item report was created successfully!`
      );

      setForm({
        title: "",
        description: "",
        category: "Electronics",
        location: "",
        item_type: "lost",
        image_url: "",
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to CampusFind. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            CampusFind
          </Link>

          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Help your campus community
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Report an item
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Lost something or found an item on campus? Share the details to
            help it find its way to the right person.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="item_type">
              What are you reporting?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "lost", label: "I lost an item" },
                { value: "found", label: "I found an item" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    form.item_type === option.value
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="item_type"
                    value={option.value}
                    checked={form.item_type === option.value}
                    onChange={handleChange}
                    className="accent-blue-700"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="title">
              Item name
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Stainless steel water bottle"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              placeholder="Describe the item and any identifying details."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="location">
                Campus location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Library, Level 2"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="image_url">
              Image URL <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://example.com/item-photo.jpg"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              For now, enter a publicly accessible image URL. Direct photo
              uploads can be added later.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
              {success}
              <div className="mt-3">
                <Link href="/" className="font-semibold underline">
                  Return to listings →
                </Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting report..." : "Submit report"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Please do not include passwords, private documents, or other
            sensitive personal information in your report.
          </p>
        </form>
      </section>
    </main>
  );
}
