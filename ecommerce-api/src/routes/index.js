import express from "express";
import authRoutes from "./authRoutes.js";
import cartRoutes from "./cartRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentMethodRoutes from "./paymentMethodRoutes.js";
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use(cartRoutes);
router.use(categoryRoutes);
router.use(orderRoutes);
router.use(paymentMethodRoutes);
router.use(productRoutes);
router.use(userRoutes);
router.use(wishlistRoutes);

export default router;
