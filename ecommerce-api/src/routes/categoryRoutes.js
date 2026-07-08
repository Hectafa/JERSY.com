import express from "express";
import {
  categoryIdValidation,
  createCategoryValidation,
  updateCategoryValidation
} from "../validators/categoryValidators.js";
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
