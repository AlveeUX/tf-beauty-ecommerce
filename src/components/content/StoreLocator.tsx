import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { STORES } from "@/content/stores";
import { storeStatus } from "@/lib/store-status";
import styles from "./StoreLocator.module.css";

/** Directions open Google Maps for the address; nothing is sent until the visitor clicks. */
const directions = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Store location page body. Figma 3:24455: 645 x 715 map on the left, three 645 x 224 store cards on the right. */
export function StoreLocator({ now }: { now: Date }) {
  return (
    <div className={`container ${styles.page}`}>
      <div className={`${styles.map} m-fade-soft`} data-testid="store-map">
        <Image
          src="/images/stores/map.png"
          alt="Map of central Copenhagen showing our stores"
          fill
          priority
          sizes="645px"
          className={styles.mapImage}
        />
        {/* Figma "Ellipse 242": a round photo pin over Indre By */}
        <Image
          src="/images/stores/marker.png"
          alt=""
          width={181}
          height={181}
          className={styles.pin}
          aria-hidden="true"
        />
      </div>
      <ul className={styles.list} aria-label="Our stores" data-reveal-stagger>
        {STORES.map((store) => {
          const status = storeStatus(store.hours, store.timeZone, now);
          return (
            <li
              key={store.id}
              className={styles.card}
              data-testid="store-card"
              data-reveal="fade-up"
            >
              <h2>{store.name}</h2>
              {store.distance ? <p className={styles.distance}>{store.distance}</p> : null}
              <address>{store.address}</address>
              <a className={styles.phone} href={`tel:${store.phone.replaceAll(" ", "")}`}>
                {store.phone}
              </a>
              <p
                className={styles.status}
                data-open={status.open || undefined}
                data-testid="store-status"
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.state}>{status.open ? "Open" : "Closed"}</span>
                {" · "}
                {status.text}
              </p>
              <a
                className={styles.directions}
                href={directions(store.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Get direction</span>
                <Icon name="arrow-up-right" size={18} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
