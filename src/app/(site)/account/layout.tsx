import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHero title="My account" />
      <AccountShell>{children}</AccountShell>
      <BenefitStrip />
    </>
  );
}
