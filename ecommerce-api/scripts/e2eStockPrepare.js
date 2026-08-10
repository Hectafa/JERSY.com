import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/Product.js";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, ".e2e-stock-snapshot.json");
const BOOSTED_SIZE_STOCK = 50;

async function run() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
  );

  const products = await Product.find({ "sizes.0": { $exists: true } });

  if (await fs.access(SNAPSHOT_PATH).then(() => true).catch(() => false)) {
    console.error(
      `Ya existe un snapshot en ${SNAPSHOT_PATH}. Corre "npm run e2e:stock:restore" antes de preparar de nuevo (evita perder el stock original).`,
    );
    process.exit(1);
  }

  const snapshot = products.map((product) => ({
    _id: product._id.toString(),
    stock: product.stock,
    sizes: product.sizes.map((s) => ({ size: s.size, stock: s.stock })),
  }));

  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));

  for (const product of products) {
    product.sizes = product.sizes.map((s) => ({
      size: s.size,
      stock: BOOSTED_SIZE_STOCK,
    }));
    product.stock = BOOSTED_SIZE_STOCK * product.sizes.length;
    await product.save();
  }

  console.log(
    `Stock elevado a ${BOOSTED_SIZE_STOCK}/talla en ${products.length} producto(s).`,
  );
  console.log(`Snapshot del stock original guardado en ${SNAPSHOT_PATH}.`);
  console.log('Cuando termines de correr Cypress: npm run e2e:stock:restore');

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
