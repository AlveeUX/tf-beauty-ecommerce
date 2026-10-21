"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { FAQ_CATEGORIES } from "@/content/faqs";
import { Accordion } from "./Accordion";
import styles from "./FaqPage.module.css";

/** FAQs. Figma 3:27601: search band, topic list with a "Still stuck?" card, four accordion sections. */
export function FaqPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(FAQ_CATEGORIES[0]!.id);
  const needle = query.trim().toLowerCase();

  const categories = useMemo(
    () =>
      FAQ_CATEGORIES.map((category) => ({
        ...category,
        items: needle
          ? category.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(needle))
          : category.items,
      })).filter((category) => category.items.length > 0),
    [needle],
  );

  // the topic being read is the last section whose top has passed the upper third of the screen
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.34;
      let current = categories[0]?.id;
      for (const category of categories) {
        const el = document.getElementById(category.id);
        if (el && el.getBoundingClientRect().top <= line) current = category.id;
      }
      if (current) setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [categories]);

  return (
    <>
      <section className={styles.search} aria-labelledby="faq-title" data-reveal="fade-up">
        <p className={styles.label}>Search FAQs</p>
        <h2 id="faq-title" className={styles.display}>
          Questions, answered
        </h2>
        <p className={styles.sub}>
          Everything about your order, your skin, and how we make things — search below or browse by
          topic.
        </p>
        <div className={styles.box}>
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “return policy or sensitive skin”"
            aria-label="Search the FAQs"
            data-testid="faq-search"
          />
        </div>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {needle ? `${categories.reduce((n, c) => n + c.items.length, 0)} questions match` : ""}
        </p>
      </section>

      <div className={`container ${styles.page}`}>
        <aside className={styles.side} data-reveal="fade">
          <nav aria-label="Topics" className={styles.tabs}>
            {FAQ_CATEGORIES.map((category) => {
              const visible = categories.some((c) => c.id === category.id);
              return (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  aria-current={visible && active === category.id ? "true" : undefined}
                  data-muted={!visible || undefined}
                  onClick={() => setActive(category.id)}
                >
                  {category.tab}
                </a>
              );
            })}
          </nav>
          <div className={styles.stuck}>
            <h2>Still stuck?</h2>
            <p>Our team replies within hours, every day of the week</p>
            <Link href="/contact" className={styles.contact}>
              <span>Contact us</span>
              <Icon name="arrow-up-right" size={18} />
            </Link>
          </div>
        </aside>

        <div className={styles.main}>
          {categories.length === 0 ? (
            <p className={styles.none} data-testid="faq-none">
              No question matches “{query.trim()}”. Try another word, or{" "}
              <Link href="/contact">contact us</Link>.
            </p>
          ) : (
            categories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className={styles.section}
                aria-labelledby={`${category.id}-title`}
                data-testid="faq-section"
                data-reveal="fade-up"
              >
                <header>
                  <span className={styles.icon}>
                    <Icon name={category.icon} size={24} />
                  </span>
                  <h2 id={`${category.id}-title`}>{category.title}</h2>
                </header>
                <Accordion
                  items={category.items}
                  defaultOpen={[category.items[0]!.id]}
                  forceOpen={Boolean(needle)}
                />
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}
