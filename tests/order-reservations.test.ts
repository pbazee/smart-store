import { test } from "node:test";
import assert from "node:assert/strict";
import { getReservationExpiryDate, isReservationExpired, reservationWindowMinutes } from "../lib/reservation-timing";

test("stock reservations expire after the configured window", () => {
  const createdAt = new Date("2026-03-10T10:00:00.000Z");
  const expiresAt = getReservationExpiryDate(createdAt);

  assert.equal(
    expiresAt.getTime(),
    createdAt.getTime() + reservationWindowMinutes * 60 * 1000
  );
  assert.equal(isReservationExpired(expiresAt, new Date("2026-03-10T10:10:00.000Z")), false);
  assert.equal(isReservationExpired(expiresAt, new Date("2026-03-10T10:16:00.000Z")), true);
});
