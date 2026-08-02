import { body, param } from "express-validator";
import { PRODUCT_SIZES } from "../models/Product.js";

export const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

export const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

export const createOrderValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.productId")
    .notEmpty()
    .withMessage("Each product item must include productId")
    .isMongoId()
    .withMessage("Each productId must be a valid MongoDB ObjectId"),
  body("products.*.size")
    .optional({ nullable: true })
    .isIn(PRODUCT_SIZES)
    .withMessage(`Size must be one of: ${PRODUCT_SIZES.join(", ")}`),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
  body("products.*.price")
    .notEmpty()
    .withMessage("Each product item must include price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isMongoId()
    .withMessage("Address must be a valid MongoDB ObjectId"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isMongoId()
    .withMessage("Payment method must be a valid MongoDB ObjectId"),
  body("totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
];

export const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),
];
