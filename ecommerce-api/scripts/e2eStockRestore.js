import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/Product.js";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, ".e2e-stock-snapshot.json");

async function run() {
  const raw = await fs.readFile(SNAPSHOT_PATH, "utf-8").catch(() => null);
  if (!raw) {
    console.error(
      `No se encontró ${SNAPSHOT_PATH}. ¿Ya corriste "npm run e2e:stock:prepare"?`,
    );
    process.exit(1);
  }
  const snapshot = JSON.parse(raw);

  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
  );

  for (const entry of snapshot) {
    await Product.findByIdAndUpdate(entry._id, {
      stock: entry.stock,
      sizes: entry.sizes,
    });
  }

  await fs.unlink(SNAPSHOT_PATH);

  console.log(`Stock original restaurado en ${snapshot.length} producto(s).`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
