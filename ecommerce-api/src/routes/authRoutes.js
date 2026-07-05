import express from "express";
import { register, login } from "../controllers/authController.js";
import validate from "../middlewares/validation.js";
import { registerValidation, loginValidation } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

export default router;
