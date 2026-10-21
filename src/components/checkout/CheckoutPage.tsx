"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { useCart } from "@/components/cart/CartProvider";
import { Checkbox } from "@/components/form/Checkbox";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/ui/Icon";
import { SHIPPING_COUNTRIES, type PaymentMethodId } from "@/config/store";
import { useAddresses, useCurrentUser } from "@/lib/demo-store/account";
import { placeDemoOrder } from "@/lib/demo-store/orders";
import { formatMoney } from "@/lib/money";
import { checkoutSchema, fieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import { shippingFor } from "@/lib/totals";
import { METHOD_COPY } from "./methods";
import styles from "./Checkout.module.css";

export type CheckoutPrefill = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  phone: string;
};

type Props = { methods: PaymentMethodId[] };

const PAYMENTS = "/images/ui/payments.svg";

/** One key per checkout attempt; a failed payment needs a fresh one because the failed order keeps its key. */
const newKey = () => `chk_${crypto.randomUUID().replaceAll("-", "")}`;

/**
 * Checkout (CHK-001..006, 008). Figma 3:22268: coupon notice, free-shipping bar, billing form on the
 * left, order summary with payment methods on the right. Demo mode: the order is stored in the browser
 * and nothing is charged (see `placeDemoOrder` in `src/lib/demo-store/orders.ts`).
 */
export function CheckoutPage({ methods }: Props) {
  const router = useRouter();
  const { cart, ready, clear, refresh } = useCart();
  const { user } = useCurrentUser();
  const saved = useAddresses(user?.id ?? null)[0];
  // a signed-in customer's email and default address pre-fill the form; what the shopper types wins
  const prefill: CheckoutPrefill = {
    email: user?.email ?? "",
    firstName: saved?.firstName ?? "",
    lastName: saved?.lastName ?? "",
    company: saved?.company ?? "",
    country: saved?.country ?? SHIPPING_COUNTRIES[0],
    address1: saved?.address1 ?? "",
    address2: saved?.address2 ?? "",
    city: saved?.city ?? "",
    postcode: saved?.postcode ?? "",
    phone: saved?.phone ?? "",
  };
  const [edited, setEdited] = useState<Partial<CheckoutPrefill & { notes: string }>>({});
  const values: CheckoutPrefill & { notes: string } = { ...prefill, notes: "", ...edited };
  const [method, setMethod] = useState<PaymentMethodId>(methods[0] ?? "bank_transfer");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<{ message: string; items?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const key = useRef<string>("");
  key.current ||= newKey();
  const placing = useRef(false);

  const formRef = useRef<HTMLFormElement>(null);

  const set = (name: keyof typeof values) => (value: string) =>
    setEdited((v) => ({ ...v, [name]: value }));

  if (!ready && cart.lines.length === 0) {
    return <div className={`container ${styles.page} ${styles.pending}`} aria-busy="true" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty} data-testid="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add something to your cart before you check out.</p>
          <Link href="/shop" className={`${styles.dark} m-btn`}>
            <span>Continue shopping</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = shippingFor(cart.subtotalCents);
  const total = cart.subtotalCents + shipping;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    const parsed = checkoutSchema.safeParse({
      ...values,
      paymentMethod: method,
      acceptTerms: accepted,
      idempotencyKey: key.current,
    });
    if (!parsed.success) {
      const found = fieldErrors(parsed.error);
      setErrors(found);
      // move focus to the first field with a problem so keyboard and screen-reader users land on it
      const first = Object.keys(found)[0];
      formRef.current
        ?.querySelector<HTMLElement>(
          `[data-testid="field-${first}"], [data-testid="check-${first}"]`,
        )
        ?.focus();
      return;
    }
    setErrors({});
    if (placing.current) return; // a double click must not create two orders (CHK-006)
    placing.current = true;
    setBusy(true);
    // stock may have changed since the cart was loaded: re-read it, then place the order from the fresh cart
    const result = placeDemoOrder(parsed.data, await refresh());
    if (result.ok) {
      await clear();
      router.push(`/checkout/confirmation/${result.order.number}`);
      return;
    }
    setProblem({ message: result.error.message, items: result.error.items });
    // a declined payment used up this key
    if (result.error.code === "payment_failed") key.current = newKey();
    placing.current = false;
    setBusy(false);
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.couponBar} data-reveal="fade">
        <p>
          Have a coupon?{" "}
          <button
            type="button"
            className={styles.inlineLink}
            aria-expanded={couponOpen}
            aria-controls="coupon-form"
            onClick={() => setCouponOpen((open) => !open)}
          >
            Click here
          </button>{" "}
          to enter your code
        </p>
      </div>
      {couponOpen ? (
        <form
          id="coupon-form"
          className={styles.couponForm}
          onSubmit={(event) => {
            event.preventDefault();
            // demo mode has no coupon rules, so every code is rejected
            setCouponMessage("This coupon code is not valid.");
          }}
        >
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Coupon code"
            aria-label="Coupon code"
            data-testid="coupon-input"
          />
          <button type="submit" className={`${styles.dark} m-btn`}>
            <span>Apply coupon</span>
            <Icon name="arrow-up-right" size={18} />
          </button>
          {couponMessage ? (
            <p role="alert" className={styles.couponMessage}>
              {couponMessage}
            </p>
          ) : null}
        </form>
      ) : null}

      <form
        ref={formRef}
        className={styles.layout}
        onSubmit={submit}
        noValidate
        data-testid="checkout-form"
        data-reveal-stagger
      >
        <div className={styles.main} data-reveal="fade-up">
          <FreeShippingBar
            subtotalCents={cart.subtotalCents}
            thresholdCents={cart.freeShippingThresholdCents}
            variant="page"
          />
          <h2 className={styles.heading}>Billing details</h2>
          <div className={styles.fields}>
            <Field
              label="First name"
              name="firstName"
              value={values.firstName}
              onChange={set("firstName")}
              error={errors.firstName}
              autoComplete="given-name"
              required
            />
            <Field
              label="Last name"
              name="lastName"
              value={values.lastName}
              onChange={set("lastName")}
              error={errors.lastName}
              autoComplete="family-name"
              required
            />
            <Field
              label="Company name"
              name="company"
              value={values.company}
              onChange={set("company")}
              error={errors.company}
              autoComplete="organization"
              optional
            />
            <Field
              label="Country / Region"
              name="country"
              kind="select"
              options={SHIPPING_COUNTRIES}
              value={values.country}
              onChange={set("country")}
              error={errors.country}
              autoComplete="country-name"
              required
            />
            <div className={styles.pair}>
              <Field
                label="Street address"
                name="address1"
                value={values.address1}
                onChange={set("address1")}
                error={errors.address1}
                placeholder="House number and street number"
                autoComplete="address-line1"
                required
              />
              <Field
                label="Apartment, suite, unit"
                name="address2"
                hideLabel
                value={values.address2}
                onChange={set("address2")}
                error={errors.address2}
                placeholder="Apartment, suite, unite, etc. (Optional)"
                autoComplete="address-line2"
              />
            </div>
            <Field
              label="Town / City"
              name="city"
              value={values.city}
              onChange={set("city")}
              error={errors.city}
              autoComplete="address-level2"
              required
            />
            <Field
              label="Postcode"
              name="postcode"
              value={values.postcode}
              onChange={set("postcode")}
              error={errors.postcode}
              autoComplete="postal-code"
              required
            />
            <Field
              label="Phone"
              name="phone"
              kind="tel"
              value={values.phone}
              onChange={set("phone")}
              error={errors.phone}
              autoComplete="tel"
              required
            />
            <Field
              label="Email"
              name="email"
              kind="email"
              value={values.email}
              onChange={set("email")}
              error={errors.email}
              autoComplete="email"
              required
            />
            <Field
              label="Order notes"
              name="notes"
              kind="textarea"
              value={values.notes}
              onChange={set("notes")}
              error={errors.notes}
              placeholder="Notes about your order, e.g. special notes for delivery."
              optional
            />
          </div>
        </div>

        <aside className={styles.panel} aria-label="Your order" data-reveal="fade-up">
          <h2>Your order</h2>
          <div className={styles.head}>
            <span>Product</span>
            <span>Subtotal</span>
          </div>
          <ul className={styles.items} data-testid="checkout-lines">
            {cart.lines.map((line) => (
              <li key={line.variantId} className={styles.item}>
                <div className={styles.thumb}>
                  {line.image ? <Image src={line.image} alt="" fill sizes="90px" /> : null}
                </div>
                <div className={styles.itemText}>
                  <p className={styles.itemName}>
                    {line.name}
                    {line.quantity > 1 ? <span> × {line.quantity}</span> : null}
                  </p>
                  <p className={styles.itemLabel}>{line.label}</p>
                </div>
                <p className={styles.itemPrice}>{formatMoney(line.lineCents)}</p>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd data-testid="checkout-subtotal">{formatMoney(cart.subtotalCents)}</dd>
            </div>
            {shipping > 0 ? (
              <div>
                <dt>Shipping</dt>
                <dd data-testid="checkout-shipping">{formatMoney(shipping, "full")}</dd>
              </div>
            ) : null}
            <div className={styles.grand}>
              <dt>Total</dt>
              <dd data-testid="checkout-total">{formatMoney(total, "full")}</dd>
            </div>
          </dl>

          <fieldset className={styles.methods}>
            <legend className={styles.srOnly}>Payment method</legend>
            {methods.map((id) => (
              <div key={id} className={styles.method}>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={id}
                    checked={method === id}
                    onChange={() => setMethod(id)}
                    data-testid={`pay-${id}`}
                  />
                  <span className={styles.radio} aria-hidden="true" />
                  <span>{METHOD_COPY[id].label}</span>
                </label>
                {method === id ? <p>{METHOD_COPY[id].description}</p> : null}
              </div>
            ))}
            {errors.paymentMethod ? (
              <p role="alert" className={styles.error}>
                {errors.paymentMethod}
              </p>
            ) : null}
          </fieldset>

          <p className={styles.privacy}>
            Your personal data will be used to process your order, support your experience
            throughout this website, and for other purposes described in our{" "}
            <Link href="/policy/privacy">Privacy policy</Link>.
          </p>
          <div className={styles.terms}>
            <Checkbox
              name="acceptTerms"
              checked={accepted}
              onChange={setAccepted}
              error={errors.acceptTerms}
            >
              I have read and agree to the website{" "}
              <Link href="/policy/terms">terms and conditions</Link> *
            </Checkbox>
          </div>

          {problem ? (
            <div role="alert" className={styles.problem} data-testid="checkout-problem">
              <p>{problem.message}</p>
              {problem.items?.length ? <p>Please review: {problem.items.join(", ")}.</p> : null}
              {problem.items?.length ? <Link href="/cart">Go to your cart</Link> : null}
            </div>
          ) : null}

          <button
            type="submit"
            className={`${styles.place} m-btn`}
            disabled={busy}
            data-testid="place-order"
          >
            <span>{busy ? "Placing order…" : "Proceed to checkout"}</span>
            <Icon name="arrow-up-right" size={18} />
          </button>

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
      </form>
    </div>
  );
}
