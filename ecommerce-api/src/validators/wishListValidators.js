import { body, param } from "express-validator";

export const wishlistIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
];

export const userIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("User ID must be a valid MongoDB ObjectId"),
];

export const addProductValidation = [
    body("userId")
        .isMongoId()
        .withMessage("User ID must be a valid MongoDB ObjectId"),
    body("productId")
        .isMongoId()
        .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

export const removeProductValidation = [
    param("id")
        .isMongoId()
        .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
    body("productId")
        .isMongoId()
        .withMessage("Product ID must be a valid MongoDB ObjectId"),
];