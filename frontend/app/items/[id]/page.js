
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
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                item.status === "resolved"
                  ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  : item.status === "recovery_pending"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {item.status === "resolved"
                ? "Resolved"
                : item.status === "recovery_pending"
                  ? "Recovery Pending"
                  : "Open"}
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

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Description
            </h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700 dark:text-gray-300">
              {item.description}
            </p>
          </section>

                    
          {/* Owner status management */}
          {isOwner && (
            <section className="mt-10 rounded-2xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Report Status
              </h2>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Update the progress of your lost or found report.
              </p>

              <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="report-status" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    New status
                  </label>

                  <select
                    id="report-status"
                    value={newStatus}
                    onChange={(event) => setNewStatus(event.target.value)}
                    disabled={updatingStatus}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                  <label htmlFor="status-note" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />

                  <p className="mt-1 text-right text-xs text-gray-500">
                    {statusNote.length}/500 characters
                  </p>
                </div>

                {statusError && (
                  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {statusError}
                  </p>
                )}

                {statusFeedback && (
                  <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                    {statusFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={updatingStatus || !newStatus}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </form>
            </section>
          )}

          
          {/* Status history */}
          {isOwner && (
            <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Status History
              </h2>

              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track the changes made to this report.
              </p>

              {historyLoading && (
                <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Loading status history...
                </p>
              )}

              {historyError && (
                <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {historyError}
                </p>
              )}

              {!historyLoading && !historyError && statusHistory.length === 0 && (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    No status changes yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Status updates will appear here.
                  </p>
                </div>
              )}

              {!historyLoading && statusHistory.length > 0 && (
                <div className="mt-6 space-y-5">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="relative border-l-2 border-blue-200 pb-2 pl-6 dark:border-blue-900">
                      <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600" />

                      <p className="font-semibold text-gray-900 dark:text-white">
                        {entry.old_status.replaceAll("_", " ")}
                        {" → "}
                        {entry.new_status.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>

                      {entry.note && (
                        <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
            <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Possible Matches
                  </h2>

                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    CampusFind compares your lost report with
                    open found-item reports to identify possible matches.
                  </p>
                </div>

                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Smart Matching
                </span>
              </div>

              {matchesLoading && (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 dark:bg-gray-800">
                  <p className="text-gray-600 dark:text-gray-300">
                    Searching for possible matches...
                  </p>
                </div>
              )}

              {matchesError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  {matchesError}
                </div>
              )}

              {!matchesLoading &&
                !matchesError &&
                matches.length === 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-4xl" aria-hidden="true">
                      🔍
                    </span>

                    <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                      No possible matches found yet
                    </h3>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      We'll show suggestions here when suitable
                      found-item reports are available.
                    </p>
                  </div>
                )}

              {!matchesLoading &&
                !matchesError &&
                matches.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {matches.length} possible{" "}
                      {matches.length === 1 ? "match" : "matches"} found
                    </p>

                    {matches.map((match) => {
                      const foundItem = match.item;

                      return (
                        <article
                          key={foundItem.id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="flex h-48 items-center justify-center bg-gray-100 sm:h-auto sm:w-48 sm:shrink-0 dark:bg-gray-800">
                              {foundItem.image_url ? (
                                <img
                                  src={foundItem.image_url}
                                  alt={foundItem.title}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-5xl" aria-hidden="true">
                                  🎒
                                </span>
                              )}
                            </div>

                            <div className="flex-1 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                                    Found Item
                                  </span>

                                  <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                                    {foundItem.title}
                                  </h3>
                                </div>

                                <div className="rounded-lg bg-purple-50 px-3 py-2 text-center dark:bg-purple-950">
                                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                    {match.score}%
                                  </p>
                                  <p className="text-xs text-purple-600 dark:text-purple-400">
                                    Match score
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                  <strong>Category:</strong>{" "}
                                  {foundItem.category}
                                </p>

                                <p>
                                  <strong>Location:</strong>{" "}
                                  {foundItem.location}
                                </p>

                                <p>
                                  <strong>Date posted:</strong>{" "}
                                  {foundItem.created_at
                                    ? new Date(
                                        foundItem.created_at
                                      ).toLocaleDateString()
                                    : "Unavailable"}
                                </p>
                              </div>

                              {Array.isArray(match.reasons) &&
                                match.reasons.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      Why this may match
                                    </p>

                                    <ul className="mt-2 flex flex-wrap gap-2">
                                      {match.reasons.map(
                                        (reason, index) => (
                                          <li
                                            key={`${foundItem.id}-${index}`}
                                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                          >
                                            {reason}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              <Link
                                href={`/items/${foundItem.id}`}
                                className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                View Found Item →
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
