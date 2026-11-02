
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getItemById,
  getItemMatches,
  sendMessage,
  getItemStatusHistory,
  updateItemStatus,
  getLoggedInUserId,
} from "../../../lib/api";

function ItemDetailsContent() {
  const params = useParams();
  const id = params.id;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [messageError, setMessageError] = useState("");

  // Matching state
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");

  // Status management
  const [currentUserId, setCurrentUserId] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState("");
  const [statusError, setStatusError] = useState("");


  const isOwner =
    item !== null &&
    currentUserId !== null &&
    String(item.user_id) === String(currentUserId);

  console.log("FULL ITEM DATA:", JSON.stringify(item, null, 2));
  console.log("ITEM OWNER ID:", item?.user_id);
  console.log("LOGGED-IN USER ID:", currentUserId);
  console.log("IS OWNER:", isOwner);

  useEffect(() => {
  setCurrentUserId(getLoggedInUserId());
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function loadHistory() {
    if (!item || !isOwner) {
      setStatusHistory([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await getItemStatusHistory(id);

      if (!cancelled) {
        setStatusHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!cancelled) {
        setHistoryError(err.message || "Could not load status history.");
      }
    } finally {
      if (!cancelled) {
        setHistoryLoading(false);
      }
    }
  }

  loadHistory();

  return () => {
    cancelled = true;
  };
}, [item, id, isOwner]);


  // Load listing
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

  // Load possible matches for the user's lost item
  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setMatches([]);
      setMatchesError("");

      if (
        !item ||
        item.item_type !== "lost" ||
        item.status !== "open"
      ) {
        setMatchesLoading(false);
        return;
      }

      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        setMatchesLoading(false);
        return;
      }

      setMatchesLoading(true);

      try {
        const data = await getItemMatches(id);

        if (!cancelled) {
          setMatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMatchesError(
            err.message || "Could not load possible matches."
          );
        }
      } finally {
        if (!cancelled) {
          setMatchesLoading(false);
        }
      }
    }

    if (item) {
      loadMatches();
    }

    return () => {
      cancelled = true;
    };
  }, [item, id]);
  

  // Send message to reporter
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
        "Your message was sent successfully!"
      );
    } catch (err) {
      setMessageError(
        err.message || "Could not send your message."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleStatusUpdate(event) {
  event.preventDefault();

  setStatusError("");
  setStatusFeedback("");

  if (!newStatus) {
    setStatusError("Please select a status.");
    return;
  }

  setUpdatingStatus(true);

  try {
    const updatedItem = await updateItemStatus(
      id,
      newStatus,
      statusNote
    );

    setItem(updatedItem);
    setNewStatus("");
    setStatusNote("");
    setStatusFeedback("Report status updated successfully!");

    const history = await getItemStatusHistory(id);
    setStatusHistory(Array.isArray(history) ? history : []);
  } catch (err) {
    setStatusError(err.message || "Could not update the report status.");
  } finally {
    setUpdatingStatus(false);
  }
}

  
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-5">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Loading listing...
          </p>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900 dark:bg-slate-900">
          <div className="text-4xl">!</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Could not load listing
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {error || "This listing could not be found."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to listings
          </Link>
        </div>
      </main>
    );
  }

  const isLost = item.item_type === "lost";

  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString()
    : "Date unavailable";

  const statusLabel =
    item.status === "resolved"
      ? "Resolved"
      : item.status === "recovery_pending"
        ? "Recovery Pending"
        : "Open";

  const statusStyle =
    item.status === "resolved"
      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      : item.status === "recovery_pending"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";

  const panelClass =
    "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8";

  const sectionTitle =
    "text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <span aria-hidden="true">←</span>
          Back to listings
        </Link>

        {/* Main listing card */}
        <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Image area */}
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-slate-100 sm:min-h-[440px] dark:bg-slate-800">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full max-h-[520px] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-7xl" aria-hidden="true">
                  {isLost ? "🔎" : "🎒"}
                </span>
                <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  No image available for this listing
                </p>
              </div>
            )}

            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ${
                  isLost
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {isLost ? "LOST ITEM" : "FOUND ITEM"}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-9">

            {/* Title and status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {item.category}
              </span>

              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {item.title}
            </h1>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Posted on {formattedDate}
            </p>

            {/* Item information */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-950">
                    📍
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Location
                    </p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {item.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl dark:bg-indigo-950">
                    📅
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date posted
                    </p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <section className="mt-10">
              <h2 className={sectionTitle}>About this item</h2>
              <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600 dark:text-slate-300">
                {item.description || "No description provided."}
              </p>
            </section>

            {/* Owner status management */}
            {isOwner && (
              <section className={`mt-10 border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 ${panelClass}`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900">
                    ⚙️
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Manage your report</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Update the progress of your lost or found report.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStatusUpdate} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="report-status"
                      className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      New status
                    </label>

                    <select
                      id="report-status"
                      value={newStatus}
                      onChange={(event) => setNewStatus(event.target.value)}
                      disabled={updatingStatus}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
                    >
                      <option value="">Select a status</option>

                      {item.status === "open" && (
                        <>
                          <option value="recovery_pending">Recovery Pending</option>
                          <option value="resolved">Resolved</option>
                        </>
                      )}

                      {item.status === "recovery_pending" && (
                        <>
                          <option value="resolved">Resolved</option>
                          <option value="open">Reopen Report</option>
                        </>
                      )}

                      {item.status === "resolved" && (
                        <option value="open">Reopen Report</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="status-note"
                      className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Update note (optional)
                    </label>

                    <textarea
                      id="status-note"
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Add a short explanation about this status change..."
                      disabled={updatingStatus}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {statusNote.length}/500 characters
                    </p>
                  </div>

                  {statusError && (
                    <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                      {statusError}
                    </p>
                  )}

                  {statusFeedback && (
                    <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {statusFeedback}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={updatingStatus || !newStatus}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingStatus ? "Updating..." : "Update Report Status"}
                  </button>
                </form>
              </section>
            )}

            {/* Status history */}
            {isOwner && (
              <section className="mt-10 border-t border-slate-200 pt-10 dark:border-slate-800">
                <h2 className={sectionTitle}>Status history</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Track the changes made to this report.
                </p>

                {historyLoading && (
                  <p className="mt-5 text-sm text-slate-500">
                    Loading status history...
                  </p>
                )}

                {historyError && (
                  <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {historyError}
                  </p>
                )}

                {!historyLoading && !historyError && statusHistory.length === 0 && (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      No status changes yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Status updates will appear here.
                    </p>
                  </div>
                )}

                {!historyLoading && statusHistory.length > 0 && (
                  <div className="mt-6 space-y-5">
                    {statusHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="relative border-l-2 border-blue-200 pb-3 pl-6 dark:border-blue-900"
                      >
                        <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-950" />

                        <p className="font-semibold capitalize text-slate-900 dark:text-white">
                          {entry.old_status.replaceAll("_", " ")}
                          {" → "}
                          {entry.new_status.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>

                        {entry.note && (
                          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Possible matches */}
            {isLost && item.status === "open" && (
              <section className="mt-10 border-t border-slate-200 pt-10 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className={sectionTitle}>Possible matches</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      CampusFind compares your lost report with open found-item reports to identify possible matches.
                    </p>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    ✨ Smart Matching
                  </span>
                </div>

                {matchesLoading && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Searching for possible matches...
                    </p>
                  </div>
                )}

                {matchesError && (
                  <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {matchesError}
                  </div>
                )}

                {!matchesLoading && !matchesError && matches.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                    <span className="text-4xl" aria-hidden="true">🔍</span>
                    <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
                      No possible matches found yet
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Suggestions will appear here when suitable found-item reports are available.
                    </p>
                  </div>
                )}

                {!matchesLoading && !matchesError && matches.length > 0 && (
                  <div className="mt-6 space-y-5">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {matches.length} possible {matches.length === 1 ? "match" : "matches"} found
                    </p>

                    {matches.map((match) => {
                      const foundItem = match.item;

                      return (
                        <article
                          key={foundItem.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="flex min-h-48 items-center justify-center overflow-hidden bg-slate-100 sm:w-48 sm:shrink-0 dark:bg-slate-800">
                              {foundItem.image_url ? (
                                <img
                                  src={foundItem.image_url}
                                  alt={foundItem.title}
                                  className="h-48 w-full object-contain"
                                />
                              ) : (
                                <span className="text-5xl" aria-hidden="true">🎒</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    FOUND ITEM
                                  </span>

                                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                                    {foundItem.title}
                                  </h3>
                                </div>

                                <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-center dark:bg-indigo-950">
                                  <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">
                                    {match.score}%
                                  </p>
                                  <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    Match score
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <p><strong>Category:</strong> {foundItem.category}</p>
                                <p><strong>Location:</strong> {foundItem.location}</p>
                                <p>
                                  <strong>Date posted:</strong>{" "}
                                  {foundItem.created_at
                                    ? new Date(foundItem.created_at).toLocaleDateString()
                                    : "Unavailable"}
                                </p>
                              </div>

                              {Array.isArray(match.reasons) && match.reasons.length > 0 && (
                                <div className="mt-5">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Why this may match
                                  </p>
                                  <ul className="mt-3 flex flex-wrap gap-2">
                                    {match.reasons.map((reason, index) => (
                                      <li
                                        key={`${foundItem.id}-${index}`}
                                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                      >
                                        {reason}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <Link
                                href={`/items/${foundItem.id}`}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                View found item →
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Contact reporter */}
            <section className="mt-10 border-t border-slate-200 pt-10 dark:border-slate-800">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-900 dark:bg-blue-950/20 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-900">
                    💬
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Contact the reporter</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Have information about this item? Send the reporter a private message through CampusFind.
                    </p>
                  </div>
                </div>

                {item.status !== "open" ? (
                  <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    This listing is no longer open, so messaging is unavailable.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="message"
                        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
                      />

                      <p className="mt-2 text-right text-xs text-slate-400">
                        {messageText.length}/2000 characters
                      </p>
                    </div>

                    {messageError && (
                      <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                        {messageError}
                      </p>
                    )}

                    {messageFeedback && (
                      <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {messageFeedback}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {sending ? "Sending..." : "Send Message →"}
                    </button>

                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      You must be logged in to send a message. Please do not include passwords or other sensitive information.
                    </p>
                  </form>
                )}
              </div>
            </section>
          </div>
        </article>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-400"
          >
            ← Return to all listings
          </Link>
        </div>
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
