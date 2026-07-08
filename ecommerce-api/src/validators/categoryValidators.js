import { body, param } from "express-validator";

export const categoryIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Category ID must be a valid MongoDB ObjectId"),
];

export const createCategoryValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("parentCategory")
        .optional()
        .isMongoId()
        .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

export const updateCategoryValidation = [
    param("id")
        .isMongoId()
        .withMessage("Category ID must be a valid MongoDB ObjectId"),
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("description")
        .optional()
        .notEmpty()
        .withMessage("Description cannot be empty"),
    body("parentCategory")
        .optional()
        .isMongoId()
        .withMessage("Parent category must be a valid MongoDB ObjectId"),
];
