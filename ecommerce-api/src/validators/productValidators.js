import { body, param } from "express-validator";
import { PRODUCT_SIZES } from "../models/Product.js";

export const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const sizesValidation = body("sizes")
  .optional()
  .isArray()
  .withMessage("Sizes must be an array")
  .custom((sizes) => {
    for (const item of sizes) {
      if (!PRODUCT_SIZES.includes(item.size)) {
        throw new Error(`Size must be one of: ${PRODUCT_SIZES.join(", ")}`);
      }
      if (typeof item.stock !== "number" || item.stock < 0) {
        throw new Error("Each size must have a non-negative stock number");
      }
    }
    return true;
  });

export const createProductValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
  sizesValidation,
];

export const updateProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
  sizesValidation,
];
