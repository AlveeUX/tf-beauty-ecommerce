import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ABOUT } from "@/content/about";
import styles from "./AboutPage.module.css";

function Cta({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={`${styles.cta} m-btn`}>
      <span>{label}</span>
      <Icon name="arrow-up-right" size={18} />
    </Link>
  );
}

function Checks({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.checks}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" size={14} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** About us. Figma 3:28603: dark hero with stats, three reasons, founder quote, two split sections, "Pure Origins". */
export function AboutPage() {
  const { hero, reasons, quote, expert, transparency, origins } = ABOUT;
  return (
    <>
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={`${styles.heroImage} m-fade-soft`}>
          <Image
            src="/images/about/hero.jpg"
            alt="Five women of different ages and skin tones"
            fill
            priority
            sizes="50vw"
          />
        </div>
        <div className={`container ${styles.heroText}`}>
          <p className={`${styles.label} m-enter`}>{hero.label}</p>
          <h1 id="about-title" className="m-enter m-i1">
            {hero.title}
          </h1>
          <p className={`${styles.lead} m-enter m-i2`}>{hero.text}</p>
          <Cta {...hero.cta} />
          <dl className={`${styles.stats} m-enter m-i3`} data-testid="about-stats">
            {hero.stats.map((stat) => (
              <div key={stat.label}>
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`container ${styles.reasons}`} aria-labelledby="reasons-title">
        <p className={`${styles.label} ${styles.center}`} data-reveal="fade-up">
          {reasons.label}
        </p>
        <h2
          id="reasons-title"
          className={`${styles.display} ${styles.center}`}
          data-reveal="fade-up"
        >
          {reasons.title}
        </h2>
        <ol className={styles.cards} data-reveal-stagger>
          {reasons.items.map((item, index) => (
            <li key={item.title} data-reveal="fade-up">
              <div className={styles.cardImage}>
                <Image src={item.image} alt="" fill sizes="420px" />
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}.</span>
              </div>
              <h3>{item.title}</h3>
              <p style={{ maxWidth: item.width }}>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.quoteBand} aria-label="From our founder" data-reveal="fade">
        <Image src="/images/about/quote.svg" alt="" width={80} height={80} unoptimized />
        <blockquote>{quote.text}</blockquote>
        <figure>
          <div className={styles.portrait}>
            <Image src={quote.portrait} alt="" fill sizes="100px" />
          </div>
          <figcaption>
            <strong>{quote.name}</strong>
            <span>{quote.role}</span>
          </figcaption>
        </figure>
      </section>

      <section className={`container ${styles.split}`} aria-labelledby="expert-title">
        <div className={`${styles.splitImage} ${styles.imageStart}`} data-reveal="clip-left">
          <Image src={expert.image} alt="A light-therapy treatment" fill sizes="645px" />
        </div>
        <div className={`${styles.splitText} ${styles.textEnd}`} data-reveal="fade-up">
          <p className={styles.label}>{expert.label}</p>
          <h2 id="expert-title" className={styles.display}>
            {expert.title}
          </h2>
          <p className={styles.body}>{expert.text}</p>
          <Checks items={expert.points} />
          <Cta {...expert.cta} />
        </div>
      </section>

      <section
        className={`container ${styles.split} ${styles.splitSecond}`}
        aria-labelledby="trace-title"
      >
        <div className={`${styles.splitText} ${styles.textStart}`} data-reveal="fade-up">
          <p className={styles.label}>{transparency.label}</p>
          <h2 id="trace-title" className={`${styles.display} ${styles.narrow}`}>
            {transparency.title}
          </h2>
          <p className={styles.body}>{transparency.text}</p>
          <Checks items={transparency.points} />
          <Cta {...transparency.cta} />
        </div>
        <div className={`${styles.splitImage} ${styles.imageEnd}`} data-reveal="clip-right">
          <Image src={transparency.image} alt="Natural ingredients" fill sizes="645px" />
        </div>
      </section>

      <section className={styles.origins} aria-labelledby="origins-title">
        <div className={styles.originsInner}>
          <p className={`${styles.label} ${styles.center}`} data-reveal="fade-up">
            {origins.label}
          </p>
          <h2
            id="origins-title"
            className={`${styles.display} ${styles.light} ${styles.center}`}
            data-reveal="fade-up"
          >
            {origins.title}
          </h2>
          <ol className={styles.steps} data-reveal-stagger>
            {origins.steps.map((step) => (
              <li key={step.n} data-reveal="fade-up">
                <span className={styles.outline} aria-hidden="true">
                  {step.n}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
