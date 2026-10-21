import Image from "next/image";
import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { METHOD_LABEL, STATUS_LABEL, TRACKING_STEPS, type OrderView } from "@/lib/orders";
import styles from "./OrderDetails.module.css";

/** Where the shopper is in the lifecycle (TRK-002). Cancelled/refunded/failed orders show one closing state. */
export function OrderTimeline({ order }: { order: OrderView }) {
  const closed = ["cancelled", "refunded", "failed"].includes(order.status);
  const reached = new Set(order.events.map((e) => e.status));
  const currentIndex = TRACKING_STEPS.indexOf(order.status as (typeof TRACKING_STEPS)[number]);

  return (
    <div data-testid="order-timeline">
      <ol className={styles.steps} aria-label="Order progress">
        {TRACKING_STEPS.map((step, index) => {
          const done = closed ? reached.has(step) : index <= currentIndex;
          const current = !closed && index === currentIndex;
          return (
            <li
              key={step}
              data-done={done ? "" : undefined}
              aria-current={current ? "step" : undefined}
              data-testid={`step-${step}`}
            >
              <span className={styles.dot} aria-hidden="true" />
              {STATUS_LABEL[step]}
            </li>
          );
        })}
        {closed ? (
          <li data-done="" aria-current="step" data-closed="" data-testid={`step-${order.status}`}>
            <span className={styles.dot} aria-hidden="true" />
            {STATUS_LABEL[order.status]}
          </li>
        ) : null}
      </ol>
      <ul className={styles.log}>
        {[...order.events].reverse().map((event, index) => (
          <li key={`${event.status}-${event.at}-${index}`}>
            <time dateTime={event.at}>{formatDateTime(event.at)}</time>
            <span>
              {STATUS_LABEL[event.status]}
              {event.note ? ` · ${event.note}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PAYMENT_STATUS_LABEL = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
} as const;

/** Items, totals, payment and delivery details of one order. Used by confirmation, tracking and the account. */
export function OrderDetails({ order }: { order: OrderView }) {
  const b = order.billing;
  return (
    <div className={styles.details} data-reveal="fade-up">
      <table className={styles.items} data-testid="order-items">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Qty</th>
            <th scope="col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={`${item.sku}-${item.slug}`}>
              <td>
                <div className={styles.product}>
                  <div className={styles.thumb}>
                    {item.image ? <Image src={item.image} alt="" fill sizes="64px" /> : null}
                  </div>
                  <div>
                    <p className={styles.name}>
                      <Link href={`/product/${item.slug}`}>{item.name}</Link>
                    </p>
                    <p className={styles.label}>{item.variantLabel}</p>
                  </div>
                </div>
              </td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.lineCents, "full")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className={styles.totals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(order.subtotalCents, "full")}</dd>
        </div>
        {order.discountCents > 0 ? (
          <div>
            <dt>Discount</dt>
            <dd>−{formatMoney(order.discountCents, "full")}</dd>
          </div>
        ) : null}
        <div>
          <dt>Shipping</dt>
          <dd>{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents, "full")}</dd>
        </div>
        <div className={styles.grand}>
          <dt>Total</dt>
          <dd data-testid="order-total">{formatMoney(order.totalCents, "full")}</dd>
        </div>
      </dl>

      <div className={styles.meta}>
        <section aria-labelledby={`pay-${order.number}`}>
          <h3 id={`pay-${order.number}`}>Payment</h3>
          <p>{METHOD_LABEL[order.paymentMethod]}</p>
          <p data-testid="payment-status">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
        </section>
        <section aria-labelledby={`bill-${order.number}`}>
          <h3 id={`bill-${order.number}`}>Billing details</h3>
          <address>
            {b.firstName} {b.lastName}
            {b.company ? <br /> : null}
            {b.company}
            <br />
            {b.address1}
            {b.address2 ? (
              <>
                <br />
                {b.address2}
              </>
            ) : null}
            <br />
            {b.city}, {b.postcode}
            <br />
            {b.country}
            <br />
            {b.phone}
            <br />
            {order.email}
          </address>
        </section>
        {order.carrier || order.trackingNumber ? (
          <section aria-labelledby={`ship-${order.number}`}>
            <h3 id={`ship-${order.number}`}>Shipment</h3>
            {order.carrier ? <p>{order.carrier}</p> : null}
            {order.trackingNumber ? <p>Tracking number {order.trackingNumber}</p> : null}
          </section>
        ) : null}
      </div>
      {order.notes ? (
        <p className={styles.notes}>
          <strong>Order notes:</strong> {order.notes}
        </p>
      ) : null}
    </div>
  );
}
