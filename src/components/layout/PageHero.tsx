import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./PageHero.module.css";

export type Crumb = { label: string; href?: string };

type PageHeroProps = {
  title: string;
  /** Trail after "Home"; the last item is the current page. */
  crumbs?: Crumb[];
};

/** Inner-page banner with breadcrumb and Prata title. Figma 3:4841 (image), 3:4842 (overlays), 3:4845 (text). */
export function PageHero({ title, crumbs = [{ label: title }] }: PageHeroProps) {
  return (
    <section className={styles.hero}>
      <Image
        src="/images/ui/page-hero.png"
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className={styles.image}
      />
      <div className={styles.tint} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.content}>
        <nav aria-label="Breadcrumb">
          <ol className={styles.crumbs}>
            <li>
              <Link href="/">
                <Icon name="home" size={16} />
                Home
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={crumb.label}>
                <Icon name="chevron-right" size={12} />
                {crumb.href && i < crumbs.length - 1 ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </section>
  );
}
