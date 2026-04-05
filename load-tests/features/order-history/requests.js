// @ts-nocheck
import { trpcGet, trpcPost } from "../../lib/trpc.js";
// Cancel a booking by ID
export function cancelBooking(baseUrl, bookingId, headers) {
  return trpcPost(
    baseUrl,
    "bookings.cancel",
    { bookingId },
    { headers }
  );
}

export function getBookingsList(baseUrl, headers) {
  return trpcGet(baseUrl, "bookings.list", undefined, { headers });
}

export function getLatestBookingDetails(baseUrl, bookingId, headers) {
  return trpcGet(
    baseUrl,
    "bookings.latestBookingDetails",
    { bookingId },
    { headers }
  );
}

export function parseTrpcJson(res) {
  if (!res || !res.body) return null;

  try {
    const parsed = JSON.parse(res.body);
    return (
      parsed?.result?.data?.json ??
      parsed?.result?.data ??
      parsed?.data?.json ??
      parsed?.data ??
      null
    );
  } catch {
    return null;
  }
}

export function extractBookingId(bookingsData) {
  if (!Array.isArray(bookingsData) || bookingsData.length === 0) {
    return null;
  }

  const firstBooking = bookingsData[0];
  return firstBooking?.id ?? null;
}