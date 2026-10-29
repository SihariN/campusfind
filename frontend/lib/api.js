
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

  if (!response.ok) {
    throw new Error("Could not load listings. Please try again.");
  }

  return response.json();
}

export async function getItemById(id) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("Listing not found.");
  }

  if (!response.ok) {
    throw new Error("Could not load this listing. Please try again.");
  }

  return response.json();
}


function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusfind_token")
      : null;

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function sendMessage(itemId, content) {
  const response = await fetch(
    `${API_BASE}/items/${itemId}/messages`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not send message.");
  }

  return data;
}

export async function getInbox() {
  const response = await fetch(`${API_BASE}/messages/inbox`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not load your inbox.");
  }

  return data;
}

export async function getSentMessages() {
  const response = await fetch(`${API_BASE}/messages/sent`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not load sent messages.");
  }

  return data;
}

export async function markMessageRead(messageId) {
  const response = await fetch(
    `${API_BASE}/messages/${messageId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not mark message as read.");
  }

  return data;
}
