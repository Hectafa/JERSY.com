import express from "express";
import {
  getOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import {
  orderIdValidation,
  userIdValidation,
  createOrderValidation,
  updateOrderStatusValidation,
} from "../validators/orderValidators.js";

const router = express.Router();

router.get("/orders", authMiddleware, isAdmin, getOrders);

router.get(
  "/orders/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getOrdersByUser,
);

router.get(
  "/orders/:id",
  authMiddleware,
  orderIdValidation,
  validate,
  getOrderById,
);

router.post(
  "/orders",
  authMiddleware,
  createOrderValidation,
  validate,
  createOrder,
);

router.put(
  "/orders/:id",
  authMiddleware,
  updateOrderStatusValidation,
  validate,
  updateOrderStatus,
);

export default router;
