import type { Metadata } from "next";
import { ForgotForm } from "@/components/account/AuthForms";
import styles from "@/components/account/AuthForms.module.css";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Lost password" };

/** Figma 3:23424. */
export default function ForgotPasswordRoute() {
  return (
    <>
      <PageHero title="My account" />
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <ForgotForm />
        </div>
      </div>
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
