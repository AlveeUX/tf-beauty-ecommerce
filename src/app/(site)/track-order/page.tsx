import { pageMeta } from "@/lib/seo";
import styles from "@/components/account/AuthForms.module.css";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { TrackForm } from "@/components/tracking/TrackForm";

export const metadata = pageMeta({
  title: "Order tracking",
  description: "Enter your order number and email to follow your delivery.",
  path: "/track-order",
});

/** Figma 3:23740. */
export default function TrackOrderRoute() {
  return (
    <>
      <PageHero title="Order tracking" />
      <div
        className={`container ${styles.page}`}
        data-reveal="fade-up"
        style={{ display: "flex", flexDirection: "column", gap: 60 }}
      >
        <TrackForm />
      </div>
      <BenefitStrip />
    </>
  );
}
