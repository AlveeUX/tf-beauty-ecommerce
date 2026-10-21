import Image from "next/image";
import { CONTACT_FAQS } from "@/content/faqs";
import { Accordion } from "./Accordion";
import { ContactForm } from "./ContactForm";
import styles from "./ContactPage.module.css";
import { site } from "@/config/site";

const CARDS = [
  {
    id: "location",
    icon: "/images/contact/icon-location.svg",
    title: "Our location",
    dark: true,
    lines: [site.contact.address],
  },
  {
    id: "email",
    icon: "/images/contact/icon-email.svg",
    title: "Email us",
    dark: false,
    links: [
      { text: site.contact.emails.support, href: `mailto:${site.contact.emails.support}` },
      { text: site.contact.emails.info, href: `mailto:${site.contact.emails.info}` },
    ],
  },
  {
    id: "phone",
    icon: "/images/contact/icon-phone.svg",
    title: "Call us",
    dark: true,
    links: [{ text: site.contact.phone.display, href: site.contact.phone.href }],
  },
  {
    id: "chat",
    icon: "/images/contact/icon-chat.svg",
    title: "Live chat",
    dark: true,
    lines: [site.contact.emails.livechat],
    help: "Need Help?",
  },
] as const;

/** Contact us. Figma 3:27227: four contact cards, map beside the message form, then "Common questions". */
export function ContactPage() {
  return (
    <>
      <section className={`container ${styles.intro}`} aria-labelledby="contact-title">
        <div className={styles.head} data-reveal="fade-up">
          <div>
            <p className={styles.label}>Contact us</p>
            <h2 id="contact-title" className={styles.display}>
              Find Us and connect
            </h2>
          </div>
          <p className={styles.lead}>
            Our support team is made up of licensed estheticians and real humans — no bots reading
            scripts. <strong>Average reply time: under 4 hours.</strong>
          </p>
        </div>
        <ul className={styles.cards} data-reveal-stagger>
          {CARDS.map((card) => (
            <li
              key={card.id}
              className={styles.card}
              data-testid="contact-card"
              data-reveal="fade-up"
            >
              <span className={styles.icon} data-red={card.dark ? undefined : ""}>
                <Image src={card.icon} alt="" width={31} height={31} unoptimized />
              </span>
              <h3>{card.title}</h3>
              {"lines" in card ? <p className={styles.plain}>{card.lines[0]}</p> : null}
              {"links" in card
                ? card.links.map((link, i) => (
                    <a key={`${link.href}-${i}`} href={link.href}>
                      {link.text}
                    </a>
                  ))
                : null}
              {"help" in card ? (
                <a className={styles.help} href={`mailto:${site.contact.emails.livechat}`}>
                  {card.help}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className={`container ${styles.talk}`} aria-label="Visit us or write to us">
        <div className={styles.map} data-testid="contact-map" data-reveal="clip-left">
          <Image
            src="/images/stores/map.png"
            alt="Map of central Copenhagen"
            fill
            sizes="645px"
            className={styles.mapImage}
          />
          <Image
            src="/images/contact/pin.svg"
            alt=""
            width={60}
            height={60}
            unoptimized
            className={styles.pin}
          />
        </div>
        <ContactForm />
      </section>

      <section className={styles.faq} aria-labelledby="faq-title">
        <p className={`${styles.label} ${styles.center}`} data-reveal="fade-up">
          Read FAQ
        </p>
        <h2 id="faq-title" className={`${styles.display} ${styles.center}`} data-reveal="fade-up">
          Common questions
        </h2>
        <div className={styles.accordion} data-reveal="fade-up">
          <Accordion items={CONTACT_FAQS} defaultOpen={[CONTACT_FAQS[0]!.id]} />
        </div>
      </section>
    </>
  );
}
