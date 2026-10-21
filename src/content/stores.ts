import type { Hours } from "@/lib/store-status";
import { site } from "@/config/site";

/**
 * Store locations (CNT-005, Figma 3:24455). Names, addresses and phone numbers are the design's sample data;
 * opening hours follow the design's "Closes 8:00 PM / 7:00 PM / Opens 10:00 AM" and are the same every day.
 * The design also shows a distance ("0.4 mi"); distances need the visitor's location, which the store
 * locator does not ask for (PRD OQ-22 default: static list), so `distance` stays empty until the client decides.
 * Replace this list with your own stores.
 */
export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: Hours;
  timeZone: string;
  /** Shown top right of the card when set, e.g. "0.4 mi". */
  distance?: string;
};

export const STORES: StoreLocation[] = [
  {
    id: "copenhagen-flagship",
    name: `${site.name} — Copenhagen Flagship`,
    address: "Østergade 12, 1100 Copenhagen, Denmark",
    phone: "+45 33 11 22 33",
    hours: { open: "10:00", close: "20:00" },
    timeZone: "Europe/Copenhagen",
  },
  {
    id: "norrebro",
    name: `${site.name} — Nørrebro`,
    address: "Jægersborggade 34, 2200 Copenhagen, Denmark",
    phone: "+45 33 44 55 66",
    hours: { open: "10:00", close: "19:00" },
    timeZone: "Europe/Copenhagen",
  },
  {
    id: "aarhus",
    name: `${site.name} — Aarhus`,
    address: "Strøget 8, 8000 Aarhus, Denmark",
    phone: "+45 86 77 88 99",
    hours: { open: "10:00", close: "18:00" },
    timeZone: "Europe/Copenhagen",
  },
];
