"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import orderStyles from "@/components/orders/OrderPages.module.css";
import { OrderDetails, OrderTimeline } from "@/components/orders/OrderDetails";
import { useCurrentUser, type SessionUser } from "@/lib/demo-store/account";
import { ORDERS_KEY, newestFirst } from "@/lib/demo-store/orders";
import { useStore } from "@/lib/demo-store/storage";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { STATUS_LABEL, type OrderView } from "@/lib/orders";
import { ChangePasswordForm } from "./ChangePasswordForm";
import styles from "./Account.module.css";

const NO_ORDERS: OrderView[] = [];

/** The orders placed with this account's email in this browser, newest first. */
function useMyOrders(user: SessionUser | null): OrderView[] {
  const all = useStore<OrderView[]>(ORDERS_KEY, NO_ORDERS);
  if (!user) return NO_ORDERS;
  return newestFirst(all.filter((o) => o.email.toLowerCase() === user.email.toLowerCase()));
}

export function AccountDashboard() {
  const { user } = useCurrentUser();
  const orders = useMyOrders(user);
  if (!user) return null;
  return (
    <>
      <section data-reveal="fade-up" className={styles.card} aria-labelledby="profile">
        <h2 id="profile">Hello, {user.username}</h2>
        <dl className={styles.profile} data-testid="profile">
          <dt>User name</dt>
          <dd>{user.username}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Orders</dt>
          <dd>
            {orders.length === 0 ? (
              "None yet"
            ) : (
              <Link href="/account/orders">{orders.length} placed</Link>
            )}
          </dd>
        </dl>
      </section>
      <section className={`${styles.card} ${styles.narrow}`} aria-labelledby="password">
        <h2 id="password">Change password</h2>
        <ChangePasswordForm />
      </section>
    </>
  );
}

export function OrdersList() {
  const { user } = useCurrentUser();
  const orders = useMyOrders(user);
  return (
    <section data-reveal="fade-up" className={styles.card} aria-labelledby="orders">
      <h2 id="orders">Orders</h2>
      {orders.length === 0 ? (
        <div className={orderStyles.empty} data-testid="orders-empty">
          <p>You have not placed an order yet.</p>
          <Link href="/shop" className={orderStyles.dark}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <table className={orderStyles.list} data-testid="orders-list">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.number}>
                <td>
                  <Link href={`/account/orders/${o.number}`}>{o.number}</Link>
                </td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{STATUS_LABEL[o.status]}</td>
                <td>{formatMoney(o.totalCents, "full")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** One of the signed-in customer's own orders; another account's order behaves as "not found". */
export function OrderPage({ number }: { number: string }) {
  const { user } = useCurrentUser();
  const order = useMyOrders(user).find((o) => o.number === number);
  if (!order) return user ? notFound() : null;
  return (
    <>
      <section data-reveal="fade-up" className={styles.card} aria-labelledby="order">
        <h2 id="order" data-testid="order-heading">
          Order {order.number} · {STATUS_LABEL[order.status]}
        </h2>
        <OrderTimeline order={order} />
      </section>
      <section data-reveal="fade-up" className={styles.card} aria-label="Order details">
        <OrderDetails order={order} />
      </section>
      <p>
        <Link href="/account/orders">← All orders</Link>
      </p>
    </>
  );
}
