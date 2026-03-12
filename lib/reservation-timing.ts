export const reservationWindowMinutes = 15;

export function getReservationExpiryDate(from = new Date()) {
  return new Date(from.getTime() + reservationWindowMinutes * 60 * 1000);
}

export function isReservationExpired(expiresAt: Date | null, now = new Date()) {
  return Boolean(expiresAt && expiresAt.getTime() < now.getTime());
}