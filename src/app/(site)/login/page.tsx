import type { Metadata } from "next";
import { AuthTabs, LoginForm } from "@/components/account/AuthForms";
import styles from "@/components/account/AuthForms.module.css";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "My account" };

type Props = { searchParams: Promise<{ next?: string }> };

/** Figma 3:22750. Signed-in visitors are sent on to their account by the form (demo mode). */
export default async function LoginRoute({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <>
      <PageHero title="My account" />
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <AuthTabs active="login" />
          <LoginForm next={next} />
        </div>
      </div>
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
