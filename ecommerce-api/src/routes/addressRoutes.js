import express from "express";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import {
  addressIdValidation,
  createAddressValidation,
  updateAddressValidation,
  deleteAddressValidation,
} from "../validators/addressValidators.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/addresses", authMiddleware, getUserAddresses);
router.get(
  "/addresses/:addressId",
  authMiddleware,
  addressIdValidation,
  validate,
  getAddressById,
);
router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);
router.put(
  "/addresses/:addressId",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);
router.delete(
  "/addresses/:addressId",
  authMiddleware,
  deleteAddressValidation,
  validate,
  deleteAddress,
);

export default router;
