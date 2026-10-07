import axiosInstance from "./axios";

/**
 * Fetches all user delete requests from backend.
 * Tries `/admin/delete_request/get_delete_requests` first, then `/api/admin/delete_request/get_delete_requests`
 */
export async function fetchDeleteRequests() {
  try {
    const res = await axiosInstance.get("/admin/delete_request/get_delete_requests");
    const payload = res.data;
    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }
    if (Array.isArray(payload)) {
      return payload;
    }
    return [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await axiosInstance.get("/api/admin/delete_request/get_delete_requests");
        const payload = fallbackRes.data;
        if (payload && Array.isArray(payload.data)) {
          return payload.data;
        }
        if (Array.isArray(payload)) {
          return payload;
        }
        return [];
      } catch (fallbackErr) {
        console.warn("Delete requests fallback error:", fallbackErr.message);
        return [];
      }
    }
    console.warn("Delete requests fetch error:", err.message);
    return [];
  }
}

/**
 * Deletes a client's account from fittbot.clients and records in deleted_users table.
 * Payload: { client_id: number }
 */
export async function deleteClientAccount(clientId) {
  const payload = {
    client_id: Number(clientId),
  };

  try {
    const res = await axiosInstance.post("/admin/delete_request/delete_account", payload);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await axiosInstance.post(
          "/api/admin/delete_request/delete_account",
          payload
        );
        return fallbackRes.data;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

/**
 * Fetches all bookings and purchase records for a specific client.
 * Calls backend endpoints inside admin_api:
 * - /api/admin/purchases/client-purchase-summary/{client_id}
 * - /api/admin/users/{client_id}/session-bookings
 * - /api/admin/users/{client_id}/daily-pass-purchases
 * - /api/admin/users/{client_id}/gym-membership
 */
export async function fetchClientBookings(clientId) {
  if (!clientId) return null;

  const [summaryRes, sessionsRes, dailyPassRes, membershipsRes] = await Promise.allSettled([
    axiosInstance.get(`/api/admin/purchases/client-purchase-summary/${clientId}`).catch(() =>
      axiosInstance.get(`/admin/purchases/client-purchase-summary/${clientId}`)
    ),
    axiosInstance.get(`/api/admin/users/${clientId}/session-bookings`).catch(() =>
      axiosInstance.get(`/admin/users/${clientId}/session-bookings`)
    ),
    axiosInstance.get(`/api/admin/users/${clientId}/daily-pass-purchases`).catch(() =>
      axiosInstance.get(`/admin/users/${clientId}/daily-pass-purchases`)
    ),
    axiosInstance.get(`/api/admin/users/${clientId}/gym-membership`).catch(() =>
      axiosInstance.get(`/admin/users/${clientId}/gym-membership`)
    ),
  ]);

  const summary = summaryRes.status === "fulfilled" ? summaryRes.value?.data?.data || null : null;
  const sessions =
    sessionsRes.status === "fulfilled" && Array.isArray(sessionsRes.value?.data?.data)
      ? sessionsRes.value.data.data
      : [];
  const dailyPasses =
    dailyPassRes.status === "fulfilled" && Array.isArray(dailyPassRes.value?.data?.data)
      ? dailyPassRes.value.data.data
      : [];
  const memberships =
    membershipsRes.status === "fulfilled" && Array.isArray(membershipsRes.value?.data?.data)
      ? membershipsRes.value.data.data
      : [];

  const totalBookingsCount = sessions.length + dailyPasses.length + memberships.length;

  return {
    summary,
    sessions,
    dailyPasses,
    memberships,
    totalBookingsCount,
  };
}
