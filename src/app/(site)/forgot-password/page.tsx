import { pageMeta } from "@/lib/seo";
import { ForgotForm } from "@/components/account/AuthForms";
import styles from "@/components/account/AuthForms.module.css";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Lost password",
  description: "Request a link to reset your password.",
  path: "/forgot-password",
  noindex: true,
});

/** Figma 3:23424. */
export default function ForgotPasswordRoute() {
  return (
    <>
      <PageHero title="My account" />
      <div className={`container ${styles.page}`}>
        <div className={styles.card} data-reveal="fade-up">
          <ForgotForm />
        </div>
      </div>
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
