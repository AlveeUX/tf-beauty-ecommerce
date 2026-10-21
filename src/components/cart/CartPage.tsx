"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { MAX_LINE_QUANTITY } from "@/config/store";
import { formatMoney } from "@/lib/money";
import { useCart } from "./CartProvider";
import { FreeShippingBar } from "./FreeShippingBar";
import { QuantityStepper } from "./QuantityStepper";
import styles from "./CartPage.module.css";

type Undo = { variantId: number; quantity: number; name: string };

const PAYMENTS = "/images/ui/payments.svg";

/**
 * Cart page (CRT-002, CRT-003). Figma 3:20299 (filled) and 3:29452 (empty). Totals come from the
 * server; shipping is decided at checkout, so the total equals the subtotal here.
 */
export function CartPage() {
  const { cart, ready, busy, setQuantity, remove, clear, add } = useCart();
  const [undo, setUndo] = useState<Undo | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const empty = cart.lines.length === 0;

  async function removeLine(variantId: number, name: string, quantity: number) {
    await remove(variantId);
    setUndo({ variantId, quantity, name });
  }

  async function undoRemove() {
    if (!undo) return;
    if (
      await add({ variantId: undo.variantId, name: undo.name }, undo.quantity, {
        openDrawer: false,
      })
    ) {
      setUndo(null);
    }
  }

  function applyCoupon(event: FormEvent) {
    event.preventDefault();
    // Demo mode has no coupon rules; connect your own backend to validate codes (see the documentation).
    setCouponMessage(
      coupon.trim() ? "This coupon code is not valid." : "Enter a coupon code to apply it.",
    );
  }

  if (!ready && cart.lines.length === 0) {
    return <div className={`container ${styles.page} ${styles.pending}`} aria-busy="true" />;
  }

  return (
    <div className={`container ${styles.page}`}>
      {undo ? (
        <p className={styles.undo} role="status" data-testid="undo-bar">
          “{undo.name}” removed from cart.{" "}
          <button type="button" onClick={() => void undoRemove()}>
            Undo?
          </button>
        </p>
      ) : null}

      {empty ? (
        <div className={styles.empty} data-testid="cart-empty-page" data-reveal="fade-up">
          <div className={styles.illustration} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.boxes} src="/images/cart/empty-a.svg" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cart/empty-b.svg" alt="" />
          </div>
          <h2>Your beauty bag is empty</h2>
          <p>Discover skincare and beauty essentials made to elevate your everyday routine.</p>
          <Link href="/shop" className={`${styles.dark} m-btn`}>
            <span>Continue shopping</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
      ) : (
        <div className={styles.layout} data-reveal-stagger>
          <div className={styles.main} data-reveal="fade-up">
            <FreeShippingBar
              variant="page"
              subtotalCents={cart.subtotalCents}
              thresholdCents={cart.freeShippingThresholdCents}
            />

            <table className={styles.table} data-testid="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.lines.map((line) => (
                  <tr key={line.variantId} data-testid="cart-row">
                    <td>
                      <div className={styles.product}>
                        <Link
                          href={`/product/${line.slug}`}
                          className={styles.thumb}
                          aria-label={line.name}
                        >
                          {line.image ? <Image src={line.image} alt="" fill sizes="90px" /> : null}
                        </Link>
                        <div>
                          <p className={styles.name}>
                            <Link href={`/product/${line.slug}`}>{line.name}</Link>
                          </p>
                          <p className={styles.label}>{line.label}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className={styles.price}>
                        {line.compareAtCents && line.compareAtCents > line.unitCents ? (
                          <s>{formatMoney(line.compareAtCents)}</s>
                        ) : null}
                        <span>{formatMoney(line.unitCents)}</span>
                      </p>
                    </td>
                    <td>
                      <QuantityStepper
                        name={line.name}
                        value={line.quantity}
                        max={Math.min(line.available, MAX_LINE_QUANTITY)}
                        disabled={busy}
                        onChange={(q) => void setQuantity(line.variantId, q)}
                      />
                    </td>
                    <td>
                      <p className={styles.sub} data-testid="line-subtotal">
                        {formatMoney(line.lineCents)}
                      </p>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.x}
                        aria-label={`Remove ${line.name} from cart`}
                        onClick={() => void removeLine(line.variantId, line.name, line.quantity)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/cart/close.svg" alt="" width={11} height={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.actions}>
              <form className={styles.coupon} onSubmit={applyCoupon} noValidate>
                <label className="visually-hidden" htmlFor="coupon-code">
                  Coupon code
                </label>
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="Coupon code"
                  autoComplete="off"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  aria-describedby="coupon-status"
                />
                <button type="submit" className={`${styles.dark} m-btn`}>
                  <span>Apply coupon</span>
                  <Icon name="arrow-up-right" size={18} />
                </button>
              </form>
              <button
                type="button"
                className={styles.outline}
                disabled={busy}
                onClick={() => void clear()}
              >
                <span>Remove all</span>
              </button>
            </div>
            <p id="coupon-status" className={styles.couponMessage} role="status">
              {couponMessage}
            </p>
          </div>

          <aside className={styles.totals} aria-labelledby="cart-total-title" data-reveal="fade-up">
            <h2 id="cart-total-title">Cart total</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd data-testid="cart-subtotal">{formatMoney(cart.subtotalCents)}</dd>
              </div>
              <div className={styles.grand}>
                <dt>Total</dt>
                <dd data-testid="cart-total">{formatMoney(cart.subtotalCents, "full")}</dd>
              </div>
            </dl>
            <Link href="/checkout" className={`${styles.checkout} m-btn`}>
              <span>Proceed to checkout</span>
              <Icon name="arrow-up-right" size={18} />
            </Link>
            <div className={styles.secure}>
              <p>Guaranteed safe &amp; secure checkout</p>
              <Image
                src={PAYMENTS}
                alt="Accepted payment methods"
                width={264}
                height={24}
                unoptimized
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
