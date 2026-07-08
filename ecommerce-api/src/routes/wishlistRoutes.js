import express from "express";
import {
  wishlistIdValidation,
  userIdValidation,
  addProductValidation,
  removeProductValidation
} from "../validators/wishListValidators.js";
import {
  getWishlists,
  getWishlistByUser,
  addProductToWishlist,
  removeProductFromWishlist,
  deleteWishlist,
} from "../controllers/wishlistController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/wishlist", authMiddleware, isAdmin, getWishlists);

router.get(
  "/wishlist/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getWishlistByUser,
);

router.post(
  "/wishlist",
  authMiddleware,
  addProductValidation,
  validate,
  addProductToWishlist,
);

router.delete(
  "/wishlist/:id/product",
  authMiddleware,
  removeProductValidation,
  validate,
  removeProductFromWishlist,
);

router.delete(
  "/wishlist/:id",
  authMiddleware,
  wishlistIdValidation,
  validate,
  deleteWishlist,
);

export default router;
