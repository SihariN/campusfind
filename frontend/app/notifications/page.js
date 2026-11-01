
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getNotifications,
  markNotificationRead,
} from "../../lib/api";

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("campusfind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadNotifications();
  }, [router, loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    setUpdatingId(notificationId);
    setError("");

    try {
      await markNotificationRead(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.message || "Could not mark notification as read.");
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
            >
              ← Back to Home
            </Link>

            <h1 className="text-3xl font-bold">
              🔔 Notifications
            </h1>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Stay updated about changes to your reported items.
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-900 dark:bg-purple-950">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Unread notifications
            </p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {unreadCount}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 text-5xl">🔔</div>

            <h2 className="text-xl font-bold">
              No notifications yet
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              When someone interacts with your reported items or their
              recovery status changes, updates will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Browse items
            </Link>
          </div>
        ) : (
          /* Notification list */
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  notification.is_read
                    ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    : "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/50"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1 text-2xl">
                      {notification.is_read ? "📩" : "🔔"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">
                          {notification.title}
                        </h2>

                        {!notification.is_read && (
                          <span className="rounded-full bg-purple-600 px-2 py-1 text-xs font-semibold text-white">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(notification.created_at)}
                      </p>

                      <Link
                        href={`/items/${notification.item_id}`}
                        className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:underline dark:text-purple-400"
                      >
                        View related item →
                      </Link>
                    </div>
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={updatingId === notification.id}
                      className="shrink-0 rounded-xl border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900"
                    >
                      {updatingId === notification.id
                        ? "Updating..."
                        : "Mark as read"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh */}
        {!loading && notifications.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadNotifications}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ↻ Refresh notifications
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
