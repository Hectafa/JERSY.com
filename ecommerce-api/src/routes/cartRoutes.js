import express from "express";
import {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
} from "../controllers/cartController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import {
  cartIdValidation,
  userIdValidation,
  createCartValidation,
  putCartValidation,
} from "../validators/cartValidators.js";

const router = express.Router();

router.get("/cart", authMiddleware, isAdmin, getCarts);

router.get(
  "/cart/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

router.get(
  "/cart/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getCartByUser,
);

router.post(
  "/cart",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

router.put(
  "/cart/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

router.delete(
  "/cart/:id",
  authMiddleware,
  cartIdValidation,
  validate,
  deleteCart,
);

export default router;
