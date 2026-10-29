
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSentMessages } from "../../../lib/api";

export default function SentMessagesPage() {
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSentMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load sent messages.");
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            CampusFind
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Sent Messages
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Keep track of messages you have sent to reporters.
          </p>
        </div>

        <Link
          href="/messages/inbox"
          className="inline-flex w-fit items-center justify-center rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          ← Back to inbox
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="font-semibold text-gray-900 dark:text-white">
          Your sent messages
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {messages.length} {messages.length === 1 ? "message" : "messages"} sent
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
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

      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          Loading sent messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
          <div className="text-5xl" aria-hidden="true">
            ✉️
          </div>

          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            No sent messages yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">
            When you contact someone about a listing, your message
            will appear here.
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Sent
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.created_at
                    ? new Date(message.created_at).toLocaleString()
                    : "Date unavailable"}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                To {message.recipient_email || `User #${message.recipient_id}`}
              </p>

              <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-gray-800 dark:text-gray-200">
                {message.content}
              </p>

              <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
                <Link
                  href={`/items/${message.item_id}`}
                  className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  View related listing
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
