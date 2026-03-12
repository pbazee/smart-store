import { releaseExpiredReservations } from "@/lib/order-reservations";

async function main() {
  const releasedOrders = await releaseExpiredReservations();
  console.log(`Released ${releasedOrders} expired reservation(s).`);
}

main().catch((error) => {
  console.error("Reservation cleanup script failed:", error);
  process.exit(1);
});
