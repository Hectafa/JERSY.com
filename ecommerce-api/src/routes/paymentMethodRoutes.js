import express from "express";
import {
  paymentIdValidation,
  createPaymentValidation,
  updatePaymentValidation
} from "../validators/paymentMethodValidators.js";
import {
  getPaymentMethodsByUser,
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethodController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

router.get("/payment-methods", authMiddleware, isAdmin, getPaymentMethods);

router.get("/payment-methods/me", authMiddleware, getPaymentMethodsByUser);

router.get(
  "/payment-methods/:id",
  authMiddleware,
  isAdmin,
  paymentIdValidation,
  validate,
  getPaymentMethodById,
);

router.post(
  "/payment-methods",
  createPaymentValidation,
  authMiddleware,
  validate,
  createPaymentMethod,
);

router.put(
  "/payment-methods/:id",
  authMiddleware,
  updatePaymentValidation,
  validate,
  updatePaymentMethod,
);

router.delete(
  "/payment-methods/:id",
  authMiddleware,
  paymentIdValidation,
  validate,
  deletePaymentMethod,
);

export default router;
