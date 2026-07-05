import { body, param } from "express-validator";

export const cartIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
];

export const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

export const createCartValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

export const putCartValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
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
  body("products.*.product")
    .notEmpty()
    .withMessage("Each product item must include product ID")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];
