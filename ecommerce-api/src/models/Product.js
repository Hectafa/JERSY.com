import mongoose from "mongoose";

export const PRODUCT_SIZES = ["CH", "M", "G", "XL"];

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, enum: PRODUCT_SIZES, required: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sizes: { type: [sizeSchema], default: [] },
    imageURL: { type: String, default: "https://placehold.co/600x400" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
