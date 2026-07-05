import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // NUEVO (fix): el frontend (Checkout.jsx) y addressController ya
    // enviaban/asignaban `name` (la etiqueta de la dirección, ej. "Casa"),
    // pero el schema no lo declaraba — Mongoose lo descartaba en silencio al
    // guardar. El frontend lo conservaba localmente como workaround (ver
    // comentario en Checkout.jsx). Ahora se persiste de verdad.
    name: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      min: 4,
      max: 6,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      max: 10,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { timestamps: true },
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
