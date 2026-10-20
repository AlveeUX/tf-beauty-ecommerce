import fs from "node:fs";
import path from "node:path";
import { getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedCatalog } from "../src/db/seed";
import * as schema from "../src/db/schema";

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
  const rows = db.select().from(table).all();
  fs.writeFileSync(path.join(outDir, `${name}.json`), `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`${name}: ${rows.length}`);
}
sqlite.close();
