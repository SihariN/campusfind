
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

const initialForm = {
  title: "",
  description: "",
  category: "Electronics",
  location: "",
  item_type: "lost",
  image_url: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

export default function ReportPage() {
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedImage(null);
      setImagePreview("");
      event.target.value = "";
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      setImagePreview("");
      event.target.value = "";
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setImagePreview("");

    const fileInput = document.getElementById("item_image");
    if (fileInput) fileInput.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setUploadingImage(false);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        setError("Please log in before reporting an item.");
        return;
      }

      let imageUrl = null;

      // Upload the selected image first, if one was chosen.
      if (selectedImage) {
        setUploadingImage(true);

        const imageData = new FormData();
        imageData.append("file", selectedImage);

        const uploadResponse = await fetch(
          `${API_BASE}/uploads/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: imageData,
          }
        );

        const uploadData = await uploadResponse.json().catch(() => null);

        if (uploadResponse.status === 401) {
          localStorage.removeItem("campusfind_token");
          setError("Your session has expired. Please log in again.");
          return;
        }

        if (!uploadResponse.ok) {
          const detail = uploadData?.detail;
          const message =
            typeof detail === "string"
              ? detail
              : "Could not upload the image.";

          throw new Error(message);
        }

        if (!uploadData?.image_url) {
          throw new Error("The image upload did not return an image URL.");
        }

        imageUrl = uploadData.image_url;
        setUploadingImage(false);
      }

      // Create the report using the returned Cloudinary image URL.
      const payload = {
        ...form,
        image_url: imageUrl,
      };

      const response = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("campusfind_token");
        setError("Your session has expired. Please log in again.");
        return;
      }

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

      setForm({ ...initialForm });
      clearSelectedImage();
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to CampusFind. Check that the backend is running."
      );
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400"
          >
            CampusFind
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <span aria-hidden="true">←</span>
            Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Help your campus community
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Report an item
          </h1>

          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
            Lost something or found an item on campus? Share the details to
            help it find its way to the right person.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div>
            <label className={labelClass}>
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
                      ? "border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
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
            <label className={labelClass} htmlFor="title">
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
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="description">
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
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="location">
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
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="item_image" className={labelClass}>
              Item photo{" "}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="item_image"
              name="item_image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={loading}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-blue-950 dark:file:text-blue-300 dark:hover:file:bg-blue-900"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Choose a JPG, PNG, or WebP image. Maximum size: 5 MB.
            </p>

            {imagePreview && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Image preview
                </p>

                <img
                  src={imagePreview}
                  alt="Preview of selected item"
                  className="max-h-64 w-auto max-w-full rounded-xl border border-slate-200 object-contain dark:border-slate-600"
                />

                <button
                  type="button"
                  onClick={clearSelectedImage}
                  disabled={loading}
                  className="mt-3 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
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

              {error.toLowerCase().includes("session has expired") && (
                <Link
                  href="/login"
                  className="mt-2 inline-block font-semibold underline"
                >
                  Log in again →
                </Link>
              )}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
            >
              {success}

              <div className="mt-3">
                <Link
                  href="/"
                  className="font-semibold underline"
                >
                  Return to listings →
                </Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {loading
              ? uploadingImage
                ? "Uploading image..."
                : "Submitting report..."
              : "Submit report"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            Please do not include passwords, private documents, or other
            sensitive personal information in your report.
          </p>
        </form>
      </section>
    </main>
  );
}
