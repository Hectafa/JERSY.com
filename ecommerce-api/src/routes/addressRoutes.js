import express from "express";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/addresses", authMiddleware, getUserAddresses);
router.get("/addresses/:addressId", authMiddleware, getAddressById);
router.post("/addresses", authMiddleware, createAddress);
router.put("/addresses/:addressId", authMiddleware, updateAddress);
router.delete("/addresses/:addressId", authMiddleware, deleteAddress);

export default router;
