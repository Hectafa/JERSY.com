import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  userIdValidation,
  createUserValidation,
  updateUserValidation,
  changePasswordValidation,
} from "../validators/userValidators.js";

const router = express.Router();

router.get("/users", authMiddleware, isAdmin, getUsers);

// Sin isAdmin: la autorización owner-or-admin vive en el controller.
router.get(
  "/users/:id",
  authMiddleware,
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
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

router.put(
  "/users/:id/password",
  authMiddleware,
  [...userIdValidation, ...changePasswordValidation],
  validate,
  changePassword,
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
