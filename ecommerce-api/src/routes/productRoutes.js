import express from "express";
import {
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import {
  productIdValidation,
  createProductValidation,
  updateProductValidation,
} from "../validators/productValidators.js";

const router = express.Router();

router.get("/products/search", searchProducts);

router.get("/products", getProducts);

router.get("/products/:id", productIdValidation, validate, getProductById);

router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);

router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  updateProductValidation,
  validate,
  updateProduct,
);

router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productIdValidation,
  validate,
  deleteProduct,
);

export default router;
