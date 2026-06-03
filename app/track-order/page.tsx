import { getSupportContactInfo } from "@/lib/support-contact";
import { TrackOrderClient } from "./track-order-client";
import { getSessionUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";

type TrackedOrder = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  total: number;
  placedDate: string;
  shippingAddress: string;
  estimatedDelivery: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string | null }>;
};

export default async function TrackOrderPage() {
  const { supportPhone, supportTel } = await getSupportContactInfo();
  const sessionUser = await getSessionUser();
  let initialOrders: TrackedOrder[] = [];

  if (sessionUser?.email) {
    const orders = await prisma.order.findMany({
      where: { customerEmail: { equals: sessionUser.email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        orderStatus: true,
        paymentStatus: true,
        total: true,
        address: true,
        city: true,
        county: true,
        createdAt: true,
        shippingRule: {
          select: {
            estimatedDays: true,
          },
        },
        items: {
          select: {
            productId: true,
            productName: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    // Need to get product images for these orders
    const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.productId)).filter(Boolean)));
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, images: true },
        })
      : [];
    const productImages = new Map(products.map((product) => [product.id, product.images[0] || null]));

    initialOrders = orders.map(order => {
      const date = new Date(order.createdAt);
      date.setDate(date.getDate() + Math.max(1, order.shippingRule?.estimatedDays ?? 3));
      const estimatedDelivery = date.toLocaleDateString("en-KE", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        total: order.total,
        placedDate: order.createdAt.toISOString(),
        shippingAddress: [order.address, order.city, order.county].filter(Boolean).join(", "),
        estimatedDelivery,
        items: order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          imageUrl: productImages.get(item.productId) ?? null,
        })),
      };
    });
  }

  return (
    <TrackOrderClient 
      supportPhone={supportPhone} 
      supportTel={supportTel} 
      initialOrders={initialOrders} 
    />
  );
}
