import { randomUUID } from "crypto";
import PaymentMethod from "../models/PaymentMethod.js";

const getPaymentMethodsByUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const paymentMethods = await PaymentMethod.find({ user: userId });
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find().populate("user");
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id).populate("user");
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const {
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      cvv,
    } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany({ user }, { isDefault: false });
    }

    const newPaymentMethod = await PaymentMethod.create({
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault: isDefault || false,
      cvv,
    });
    await newPaymentMethod.populate("user");
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      cvv,
    } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: existing.user, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { type, cardNumber, cardHolderName, expiryDate, paypalEmail, bankName, accountNumber, isDefault, cvv },
      { new: true }
    ).populate("user");
    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findByIdAndDelete(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Simulador de cobro: no hay pasarela real detrás, solo una regla de prueba
// (tarjeta terminada en "0000" = rechazo) para poder probar ambos flujos.
const chargePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    const isOwner = paymentMethod.user.toString() === req.user.userId;
    const isAdminUser = req.user.role === "admin";
    if (!isOwner && !isAdminUser) {
      return res
        .status(403)
        .json({ message: "Unauthorized to use this payment method" });
    }

    const declined = paymentMethod.cardNumber?.endsWith("0000");

    if (declined) {
      return res.status(200).json({
        status: "declined",
        reason: "Fondos insuficientes o tarjeta rechazada",
        amount,
      });
    }

    res.status(200).json({
      status: "approved",
      transactionId: randomUUID(),
      amount,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPaymentMethodsByUser,
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  chargePaymentMethod,
};
