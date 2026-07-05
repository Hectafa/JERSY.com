import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  userIdValidation,
  createUserValidation,
  updateUserValidation,
} from "../validators/userValidators.js";

const router = express.Router();

router.get("/users", authMiddleware, isAdmin, getUsers);

router.get(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  getUserById,
);

router.post(
  "/users",
  authMiddleware,
  isAdmin,
  createUserValidation,
  validate,
  createUser,
);

router.put(
  "/users/:id",
  authMiddleware,
  isAdmin,
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

router.delete(
  "/users/:id",
  userIdValidation,
  validate,
  authMiddleware,
  isAdmin,
  deleteUser,
);

export default router;
