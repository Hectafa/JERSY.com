import express from "express";
import { body, param } from "express-validator";
import {
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
} from "../controllers/addressController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const addressIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Address ID must be a valid MongoDB ObjectId"),
]

const createAddressValidation = [
    body("user")
        .notEmpty()
        .withMessage("User is required")
        .isMongoId()
        .withMessage("User ID must be a valid MongoDB ObjectId"),
    body("name")
        .notEmpty()
        .isString()
        .withMessage("Name is required"),
    body("address")
        .notEmpty()
        .isString()
        .withMessage("Address is required"),
    body("city")
        .notEmpty()
        .isString()
        .withMessage("City is required"),
    body("state")
        .notEmpty()
        .isString()
        .withMessage("State is required"),
    body("postalCode")
        .notEmpty()
        .isString() 
        .withMessage("Postal code is required"),
    body("country")
        .notEmpty()
        .isString()
        .withMessage("Country is required"),
    body("phone")
        .isOptional()
        .isNumeric()
        .withMessage("Phone number must be numeric"),
]

router.get("/", authMiddleware, getAddresses);

router.get(
    "/addresses/:id", 
    authMiddleware, 
    addressIdValidation, 
    validate, 
    getAddressById
);

router.post(
    "/addresses", 
    authMiddleware, 
    createAddressValidation, 
    validate, 
    createAddress
);

router.put(
    "/addresses/:id", 
    authMiddleware, 
    addressIdValidation, 
    validate, 
    updateAddress
);

router.delete(
    "/addresses/:id", 
    authMiddleware, 
    addressIdValidation, 
    validate, 
    deleteAddress
);