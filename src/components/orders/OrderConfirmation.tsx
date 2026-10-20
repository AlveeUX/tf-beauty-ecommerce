"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { METHOD_COPY } from "@/components/checkout/methods";
import { ORDERS_KEY } from "@/lib/demo-store/orders";
import { useHydrated, useStore } from "@/lib/demo-store/storage";
import type { OrderView } from "@/lib/orders";
import { OrderDetails, OrderTimeline } from "./OrderDetails";
import styles from "./OrderPages.module.css";

const NO_ORDERS: OrderView[] = [];

/**
 * Order confirmation (CHK-007, proposed design). Demo mode: only the browser that placed the order has it
 * (it is stored in localStorage); any other browser is sent to the tracking form, which asks for the email.
 */
export function OrderConfirmation({ number }: { number: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const orders = useStore<OrderView[]>(ORDERS_KEY, NO_ORDERS);
  const order = orders.find((o) => o.number === number);

  useEffect(() => {
    if (hydrated && !order) router.replace("/track-order");
  }, [hydrated, order, router]);

  if (!order) return <div className={`container ${styles.page}`} aria-busy="true" />;

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.banner} aria-labelledby="thanks">
        <h2 id="thanks">Thank you. Your order has been received.</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Order ID</dt>
            <dd data-testid="order-number">{order.number}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{order.email}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>${(order.totalCents / 100).toFixed(2)}</dd>
          </div>
        </dl>
        <p className={styles.next} data-testid="next-steps">
          {order.paymentStatus === "paid"
            ? "Your payment was received and we are preparing your order."
            : METHOD_COPY[order.paymentMethod].description}{" "}
          {order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid"
            ? `Payment reference: ${order.number}. `
            : null}
          This is a demo store: no email is sent and nothing is charged.
        </p>
      </section>
      <OrderDetails order={order} />
      <div className={styles.timeline}>
        <h2>Order progress</h2>
        <OrderTimeline order={order} />
      </div>
      <div className={styles.actions}>
        <Link href="/track-order" className={styles.outline}>
          Track this order
        </Link>
        <Link href="/shop" className={styles.dark}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
