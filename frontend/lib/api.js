
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusfind_token")
      : null;

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function handleResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || fallbackMessage);
  }

  return data;
}

export async function getItems(params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  const url = `${API_BASE}/items${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  return handleResponse(response, "Could not load listings. Please try again.");
}

export async function getItemById(id) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("Listing not found.");
  }

  return handleResponse(response, "Could not load this listing. Please try again.");
}

export async function getItemMatches(itemId) {
  const response = await fetch(`${API_BASE}/items/${itemId}/matches`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load possible matches.");
}

export async function sendMessage(itemId, content) {
  const response = await fetch(`${API_BASE}/items/${itemId}/messages`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  return handleResponse(response, "Could not send your message.");
}

export async function getInbox() {
  const response = await fetch(`${API_BASE}/messages/inbox`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load your inbox.");
}

export async function getSentMessages() {
  const response = await fetch(`${API_BASE}/messages/sent`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load sent messages.");
}

export async function markMessageRead(messageId) {
  const response = await fetch(
    `${API_BASE}/messages/${messageId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Could not mark message as read.");
}

// Get status history.
export async function getItemStatusHistory(itemId) {
  const response = await fetch(
    `${API_BASE}/items/${itemId}/status-history`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(response, "Could not load status history.");
}

// Update report status.
export async function updateItemStatus(itemId, status, note = "") {
  const response = await fetch(
    `${API_BASE}/items/${itemId}/status`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        note: note.trim() || null,
      }),
    }
  );

  return handleResponse(response, "Could not update report status.");
}

// Get the logged-in user's ID from the JWT.
export function getLoggedInUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("campusfind_token");

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );

    return decoded.sub ? String(decoded.sub) : null;
  } catch {
    return null;
  }
}
