
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getItemById, sendMessage } from "../../../lib/api";

function ItemDetailsContent() {
  const params = useParams();
  const id = params.id;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadItem() {
      setLoading(true);
      setError("");

      try {
        const data = await getItemById(id);

        if (!cancelled) {
          setItem(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load this listing.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadItem();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSendMessage(event) {
    event.preventDefault();

    setMessageFeedback("");
    setMessageError("");

    const content = messageText.trim();

    if (!content) {
      setMessageError("Please enter a message.");
      return;
    }

    const token = localStorage.getItem("campusfind_token");

    if (!token) {
      setMessageError(
        "Please log in before contacting the reporter."
      );
      return;
    }

    setSending(true);

    try {
      await sendMessage(id, content);
      setMessageText("");
      setMessageFeedback(
        "Your message was sent successfully!");

        setTimeout(() => {
        setMessageFeedback("");
        }, 3000);
      
    } catch (err) {
      setMessageError(
        err.message || "Could not send your message."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Loading listing...
        </p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-xl font-bold text-red-700 dark:text-red-300">
            Could not load listing
          </h1>

          <p className="mt-2 text-red-600 dark:text-red-400">
            {error || "This listing could not be found."}
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to listings
        </Link>
      </main>
    );
  }

  const isLost = item.item_type === "lost";

  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString()
    : "Date unavailable";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to listings
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Listing image */}
        <div className="flex h-64 items-center justify-center overflow-hidden bg-gray-100 sm:h-80 dark:bg-gray-800">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-7xl" aria-hidden="true">
              {isLost ? "🔎" : "🎒"}
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* Type and status */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                isLost
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              }`}
            >
              {isLost ? "Lost Item" : "Found Item"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                item.status === "resolved"
                  ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {item.status === "resolved" ? "Resolved" : "Open"}
            </span>
          </div>

          {/* Listing information */}
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {item.title}
          </h1>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Category: {item.category}
          </p>

          <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 dark:bg-gray-800/70">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Location
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                📍 {item.location}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Date posted
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {formattedDate}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Description
            </h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700 dark:text-gray-300">
              {item.description}
            </p>
          </section>

          {/* Contact reporter */}
          <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contact Reporter
            </h2>

            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Have information about this item? Send the reporter a
              message through CampusFind.
            </p>

            {item.status !== "open" ? (
              <div className="mt-5 rounded-xl bg-gray-100 p-4 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                This listing has been resolved, so messaging is
                unavailable.
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="mt-5 space-y-4"
              >
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                  >
                    Your message
                  </label>

                  <textarea
                    id="message"
                    value={messageText}
                    onChange={(event) => {
                      setMessageText(event.target.value);
                      setMessageError("");
                      setMessageFeedback("");
                    }}
                    placeholder="Write a message to the reporter..."
                    rows={5}
                    maxLength={2000}
                    required
                    disabled={sending}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-900"
                  />

                  <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                    {messageText.length}/2000 characters
                  </p>
                </div>

                {messageError && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                  >
                    {messageError}
                  </p>
                )}

                {messageFeedback && (
                  <p
                    role="status"
                    className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
                  >
                    {messageFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You must be logged in to send a message. Please
                  do not include passwords or other sensitive
                  information.
                </p>
              </form>
            )}
          </section>
        </div>
      </article>

      <div className="mt-6">
        <Link
          href="/"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Return to all listings
        </Link>
      </div>
    </main>
  );
}

export default function ItemDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Loading listing...
          </p>
        </main>
      }
    >
      <ItemDetailsContent />
    </Suspense>
  );
}
