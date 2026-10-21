import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta, snippet } from "@/lib/seo";
import { PolicyPage } from "@/components/content/PolicyPage";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { getPolicy } from "@/content/policies";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policy = getPolicy((await params).slug);
  return policy
    ? pageMeta({
        title: policy.title,
        description: snippet(policy.intro),
        path: `/policy/${(await params).slug}`,
      })
    : { title: "Page not found" };
}

/** Policy pages: /policy/privacy (Figma 3:24059), /policy/shipping, /policy/returns, /policy/terms. */
export default async function PolicyRoute({ params }: Props) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <>
      <PageHero title={policy.title} />
      <PolicyPage policy={policy} />
      <BenefitStrip />
    </>
  );
}
