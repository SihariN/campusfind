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
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#0b1020] dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              YOUR ACTIVITY
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Stay up to date with messages and updates about your reported
              items.
            </p>
          </div>

          {/* Unread counter */}
          <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-sm dark:border-purple-900/50 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl dark:bg-purple-900/40">
              🔔
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Unread notifications
              </p>
              <p className="mt-0.5 text-2xl font-bold text-purple-700 dark:text-purple-300">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        {/* Notification section heading */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Recent updates
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your latest CampusFind activity
            </p>
          </div>

          {!loading && notifications.length > 0 && (
            <button
              onClick={loadNotifications}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
            >
              <span className="text-base">↻</span>
              Refresh
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <span className="text-lg">!</span>
            <p>{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600 dark:border-purple-900 dark:border-t-purple-400" />

            <p className="font-medium text-slate-700 dark:text-slate-200">
              Loading your notifications...
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Just a moment.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50 text-4xl dark:bg-purple-900/30">
              🔔
            </div>

            <h2 className="text-xl font-bold">
              You're all caught up!
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              You don't have any notifications right now. When there are
              updates about your reported items, they'll appear here.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              Explore items
              <span className="ml-2">→</span>
            </Link>
          </div>
        ) : (
          /* Notification list */
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
                  notification.is_read
                    ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    : "border-purple-200 bg-purple-50/70 dark:border-purple-900/60 dark:bg-purple-950/20"
                }`}
              >
                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-purple-500" />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {/* Notification icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                        notification.is_read
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "bg-purple-100 dark:bg-purple-900/50"
                      }`}
                    >
                      {notification.is_read ? "📩" : "🔔"}
                    </div>

                    {/* Notification content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                        {formatDate(notification.created_at)}
                      </p>

                      <Link
                        href={`/items/${notification.item_id}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-700 transition hover:gap-2 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        View related item
                        <span>→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mark as read */}
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={updatingId === notification.id}
                      className="shrink-0 self-start rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:border-purple-400 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-950/50"
                    >
                      {updatingId === notification.id
                        ? "Updating..."
                        : "Mark as read"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom information */}
        {!loading && notifications.length > 0 && (
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            You're viewing your latest notifications.
          </p>
        )}
      </div>
    </main>
  );
}
