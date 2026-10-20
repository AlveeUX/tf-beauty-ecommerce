import fs from "node:fs";
import path from "node:path";
import { getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedCatalog } from "../src/db/seed";
import * as schema from "../src/db/schema";
import { FLASH_SALE_DURATION_MS } from "../src/db/seed/home-content";

// One-off (TF1-T02, deleted in T09): seeds an in-memory database with the existing seeder and writes every
// content table to src/data/<table>.json, so the JSON is generated, never hand-copied.
const TABLES: SQLiteTable[] = [
  schema.categories,
  schema.products,
  schema.productImages,
  schema.variants,
  schema.inventory,
  schema.productCategories,
  schema.colors,
  schema.productColors,
  schema.productTags,
  schema.collections,
  schema.collectionProducts,
  schema.reviews,
  schema.banners,
  schema.blogPosts,
  schema.blogComments,
];

const { db, sqlite } = createDb(":memory:");
runMigrations(db);
seedCatalog(db);

const outDir = path.resolve("src/data");
fs.mkdirSync(outDir, { recursive: true });
for (const table of TABLES) {
  const name = getTableName(table);
  let rows: Record<string, unknown>[] = db.select().from(table).all();
  // The seed computes two deadlines from "now" (flash sale, product sale countdown). A frozen date would
  // expire, so the JSON keeps the duration instead and the provider derives the deadline when it reads.
  if (name === "banners") {
    rows = rows.map((r) =>
      r.slot === "home-flash"
        ? { ...r, endsAt: null, endsInMs: FLASH_SALE_DURATION_MS }
        : { ...r, endsInMs: null },
    );
  }
  if (name === "products") {
    rows = rows.map((r) =>
      r.saleEndsAt
        ? { ...r, saleEndsAt: null, saleEndsInMs: 20 * 86_400_000 }
        : { ...r, saleEndsInMs: null },
    );
  }
  fs.writeFileSync(path.join(outDir, `${name}.json`), `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`${name}: ${rows.length}`);
}
sqlite.close();
