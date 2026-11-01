
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInbox, markMessageRead } from "../../../lib/api";

export default function InboxPage() {
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getInbox();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load your inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("campusfind_token")) {
      router.replace("/login");
      return;
    }

    loadMessages();
  }, [loadMessages, router]);

  async function handleMarkAsRead(messageId) {
    setUpdatingId(messageId);
    setError("");

    try {
      const updatedMessage = await markMessageRead(messageId);

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? updatedMessage : message
        )
      );
    } catch (err) {
      setError(err.message || "Could not update this message.");
    } finally {
      setUpdatingId(null);
    }
  }

  const unreadCount = messages.filter(
    (message) => !message.is_read
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">

        {/* Navigation */}
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <span aria-hidden="true" className="text-lg">←</span>
            Back to CampusFind Home
          </Link>

          <Link
            href="/messages/sent"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            Sent messages →
          </Link>
        </div>

        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            CampusFind
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Inbox
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Messages people have sent you about your listings.
          </p>
        </div>

        {/* Message summary */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Your messages
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {messages.length} total
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {unreadCount} unread
          </span>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
            <button
              type="button"
              onClick={loadMessages}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            Loading your messages...
          </div>
        ) : messages.length === 0 ? (
          /* Empty inbox */
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl" aria-hidden="true">
              📭
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Your inbox is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
              When someone contacts you about a lost or found item,
              their message will appear here.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          /* Messages */
          <div className="mt-6 space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  message.is_read
                    ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    : "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        message.is_read
                          ? "bg-slate-300 dark:bg-slate-600"
                          : "bg-blue-600"
                      }`}
                    />

                    <span className="font-semibold text-slate-900 dark:text-white">
                      {message.is_read ? "Message" : "New message"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {message.created_at
                      ? new Date(message.created_at).toLocaleString()
                      : "Date unavailable"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  From {message.sender_email || `User #${message.sender_id}`}
                </p>

                <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-800 dark:text-slate-200">
                  {message.content}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <Link
                    href={`/items/${message.item_id}`}
                    className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    View related listing
                  </Link>

                  {!message.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(message.id)}
                      disabled={updatingId === message.id}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {updatingId === message.id
                        ? "Updating..."
                        : "Mark as read"}
                    </button>
                  )}

                  {message.is_read && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ✓ Read
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

