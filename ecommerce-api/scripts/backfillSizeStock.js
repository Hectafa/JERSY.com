import mongoose from "mongoose";
import dotenv from "dotenv";
import Product, { PRODUCT_SIZES } from "../src/models/Product.js";

dotenv.config();

function distributeStock(totalStock) {
  const base = Math.floor(totalStock / PRODUCT_SIZES.length);
  const remainder = totalStock % PRODUCT_SIZES.length;
  return PRODUCT_SIZES.map((size, index) => ({
    size,
    stock: base + (index < remainder ? 1 : 0),
  }));
}

async function run() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
  );

  const products = await Product.find({
    $or: [{ sizes: { $exists: false } }, { sizes: { $size: 0 } }],
  });

  console.log(`Encontrados ${products.length} producto(s) sin tallas.`);

  for (const product of products) {
    const sizes = distributeStock(product.stock || 0);
    product.sizes = sizes;
    await product.save();
    console.log(
      `- ${product.name}: stock ${product.stock} -> ${sizes
        .map((s) => `${s.size}:${s.stock}`)
        .join(" ")}`,
    );
  }

  console.log("Listo.");
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
