import { body, param } from "express-validator";

export const paymentIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
];

export const createPaymentValidation = [
    body("user")
        .notEmpty()
        .withMessage("User is required")
        .isMongoId()
        .withMessage("User ID must be a valid MongoDB ObjectId"),
    body("type")
        .notEmpty()
        .withMessage("Payment type is required")
        .isIn([
            "credit_card",
            "debit_card",
            "paypal",
            "bank_transfer",
            "cash_on_delivery",
        ])
        .withMessage("Invalid payment type"),
    body("cardNumber")
        .optional()
        .isLength({ max: 16 })
        .withMessage("Card number must be at most 16 characters"),
    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),
];

export const chargePaymentValidation = [
    param("id")
        .isMongoId()
        .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
    body("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number"),
];

export const updatePaymentValidation = [
    param("id")
        .isMongoId()
        .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
    body("type")
        .optional()
        .isIn([
            "credit_card",
            "debit_card",
            "paypal",
            "bank_transfer",
            "cash_on_delivery",
        ])
        .withMessage("Invalid payment type"),
    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),
    body("cardNumber")
        .optional()
        .isLength({ max: 16 })
        .withMessage("Card number must be at most 16 characters"),
];