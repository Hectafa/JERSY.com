import express from "express";
import { body, param } from "express-validator";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "../controllers/categoryController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const categoryIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
];

const createCategoryValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

const updateCategoryValidation = [
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

router.get("/categories", getCategories);

router.get(
  "/categories/:id/products",
  categoryIdValidation,
  validate,
  getProductsByCategoryAndChildren,
);

router.get("/categories/:id", categoryIdValidation, validate, getCategoryById);

router.post(
  "/categories",
  authMiddleware,
  isAdmin,
  createCategoryValidation,
  validate,
  createCategory,
);

router.put(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  updateCategoryValidation,
  validate,
  updateCategory,
);

router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  categoryIdValidation,
  validate,
  deleteCategory,
);

export default router;
