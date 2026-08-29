const STORAGE_KEY = "hotelUser";

// Read the saved user from localStorage, or null if nobody is logged in.
export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// Call the API and attach userId on protected requests.
export async function request(path, { method = "GET", body, withUser = false } = {}) {
  let url = path;
  const user = getStoredUser();
  let payload = body ? { ...body } : undefined;

  if (withUser && user) {
    if (method === "GET" || method === "DELETE") {
      const join = url.includes("?") ? "&" : "?";
      url += `${join}userId=${encodeURIComponent(user._id)}`;
    } else {
      payload = { ...(payload || {}), userId: user._id };
    }
  }

  const res = await fetch(`/api${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// GET helper.
export function get(path, options) {
  return request(path, { ...options, method: "GET" });
}

// POST helper.
export function post(path, body, options) {
  return request(path, { ...options, method: "POST", body });
}

// PUT helper.
export function put(path, body, options) {
  return request(path, { ...options, method: "PUT", body });
}

// DELETE helper.
export function del(path, options) {
  return request(path, { ...options, method: "DELETE" });
}
