import { pageMeta } from "@/lib/seo";
import { ResetPanel } from "@/components/account/AuthForms";
import styles from "@/components/account/AuthForms.module.css";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Reset password",
  description: "Choose a new password for your account.",
  path: "/reset-password",
  noindex: true,
});

type Props = { searchParams: Promise<{ token?: string }> };

/** Target of the reset link (proposed design: the forgot-password card with one field). */
export default async function ResetPasswordRoute({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <>
      <PageHero title="My account" />
      <div className={`container ${styles.page}`}>
        <div className={styles.card} data-reveal="fade-up">
          <ResetPanel token={token} />
        </div>
      </div>
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
