import { pageMeta } from "@/lib/seo";
import { AuthTabs, RegisterForm } from "@/components/account/AuthForms";
import styles from "@/components/account/AuthForms.module.css";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Register",
  description: "Create an account to follow your orders and save your addresses.",
  path: "/register",
  noindex: true,
});

type Props = { searchParams: Promise<{ next?: string }> };

/** Figma the register frame. Signed-in visitors are sent on to their account by the form (demo mode). */
export default async function RegisterRoute({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <>
      <PageHero title="My account" />
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <AuthTabs active="register" />
          <RegisterForm next={next} />
        </div>
      </div>
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
