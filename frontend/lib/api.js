
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

// Get all notifications for the logged-in user.
export async function getNotifications() {
  const response = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load notifications.");
}

// Get the number of unread notifications.
export async function getUnreadNotificationCount() {
  const response = await fetch(
    `${API_BASE}/notifications/unread-count`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Could not load unread notification count."
  );
}

// Mark a notification as read.
export async function markNotificationRead(notificationId) {
  const response = await fetch(
    `${API_BASE}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(
    response,
    "Could not mark notification as read."
  );
}


// Get the logged-in user's profile.
export async function getMyProfile() {
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load your profile.");
}

// Update the user's profile information.
export async function updateMyProfile(profileData) {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  return handleResponse(response, "Could not update your profile.");
}

// Upload or replace the profile picture.
export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/users/me/profile-picture`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    }
  );

  return handleResponse(response, "Could not upload profile picture.");
}

// Remove the profile picture.
export async function removeProfilePicture() {
  const response = await fetch(
    `${API_BASE}/users/me/profile-picture`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Could not remove profile picture.");
}


// Change the logged-in user's password.
export async function changeMyPassword(passwordData) {
  const response = await fetch(
    `${API_BASE}/users/me/change-password`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwordData),
    }
  );

  return handleResponse(response, "Could not change your password.");
}


// ---------------------------------------------------------
// ADMIN DASHBOARD API
// ---------------------------------------------------------

// Get the current administrator's profile and verify access.
export async function getAdminProfile() {
  const response = await fetch(`${API_BASE}/admin/me`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(
    response,
    "Administrator access required."
  );
}

// Get dashboard statistics.
export async function getAdminDashboardStats() {
  const response = await fetch(
    `${API_BASE}/admin/dashboard/stats`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Could not load dashboard statistics."
  );
}

// Get recent platform activity.
export async function getAdminRecentActivity(limit = 15) {
  const response = await fetch(
    `${API_BASE}/admin/dashboard/activity?limit=${limit}`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Could not load recent activity."
  );
}

// Get listings with optional filters and pagination.
export async function getAdminListings({
  item_type = "",
  status = "",
  search = "",
  skip = 0,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();

  if (item_type) params.set("item_type", item_type);
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  params.set("skip", String(skip));
  params.set("limit", String(limit));

  const response = await fetch(
    `${API_BASE}/admin/listings?${params.toString()}`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Could not load admin listings."
  );
}


// Get users for the administrator dashboard.
export async function getAdminUsers(params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  const url = `${API_BASE}/admin/users${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse(response, "Could not load users.");
}

// Update a user's role (administrator only).
export async function updateAdminUserRole(userId, newRole) {
  const params = new URLSearchParams({
    new_role: newRole,
  });

  const response = await fetch(
    `${API_BASE}/admin/users/${userId}/role?${params.toString()}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(response, "Could not update user role.");
}

export async function removeAdminListing(itemId, reason) {
  const params = new URLSearchParams({ reason });

  const response = await fetch(
    `${API_BASE}/admin/listings/${itemId}?${params.toString()}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleResponse(response, "Could not remove listing.");
}