import {param, body} from "express-validator";

export const addressIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

export const createAddressValidation = [
    body("name")
        .notEmpty()
        .withMessage("Name is required"),
    body("address")
        .notEmpty()
        .withMessage("Address is required"),
    body("city")
        .notEmpty()
        .withMessage("City is required"),
    body("state")
        .notEmpty()
        .withMessage("State is required"),
    body("postalCode")
        .notEmpty()
        .withMessage("Postal code is required"),
    body("country")
        .notEmpty()
        .withMessage("Country is required"),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Phone number must be a valid mobile phone number"),
    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),
    body("addressType")
        .optional()
        .isIn(["home", "work", "other"])
        .withMessage("addressType must be one of 'home', 'work', or 'other'"),
];

export const updateAddressValidation = [
    param("id")
        .isMongoId()
        .withMessage("Address ID must be a valid MongoDB ObjectId"),
    body("name")
        .optional()
        .notEmpty()
        .withMessage("Name cannot be empty"),
    body("address")
        .optional()
        .notEmpty()
        .withMessage("Address cannot be empty"),
    body("city")
        .optional()
        .notEmpty()
        .withMessage("City cannot be empty"),
    body("state")
        .optional()
        .notEmpty()
        .withMessage("State cannot be empty"),
    body("postalCode")
        .optional()
        .notEmpty()
        .withMessage("Postal code cannot be empty"),
    body("country")
        .optional()
        .notEmpty()
        .withMessage("Country cannot be empty"),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Phone number must be a valid mobile phone number"),
    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),
    body("addressType")
        .optional()
        .isIn(["home", "work", "other"])
        .withMessage("addressType must be one of 'home', 'work', or 'other'"),
];

export const deleteAddressValidation = [
    param("id")
        .isMongoId()
        .withMessage("Address ID must be a valid MongoDB ObjectId"),
];
