import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../src/models/User.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import Address from "../../src/models/Address.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";

let counter = 0;
const unique = () => `${Date.now()}-${counter++}`;

export const createUser = async ({ role = "customer", password = "Password123!" } = {}) => {
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: `Test User ${unique()}`,
    email: `user-${unique()}@example.com`,
    password: hashPassword,
    role,
  });

  const token = jwt.sign(
    { userId: user._id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { user, token, password };
};

export const createAdmin = (overrides) => createUser({ ...overrides, role: "admin" });

export const authHeader = (token) => `Bearer ${token}`;

export const createCategory = (overrides = {}) =>
  Category.create({
    name: `Category ${unique()}`,
    description: "Test category",
    ...overrides,
  });

export const createProduct = async (overrides = {}) => {
  const category = overrides.category ?? (await createCategory())._id;
  return Product.create({
    name: `Product ${unique()}`,
    description: "Test product",
    price: 100,
    stock: 10,
    ...overrides,
    category,
  });
};

export const createAddress = (userId, overrides = {}) =>
  Address.create({
    user: userId,
    address: "Calle Falsa 123",
    city: "Springfield",
    state: "Springfield",
    postalCode: "12345",
    country: "AR",
    phone: "1234567890",
    ...overrides,
  });

export const createPaymentMethod = (userId, overrides = {}) =>
  PaymentMethod.create({
    user: userId,
    type: "credit_card",
    cardNumber: "4111111111111111",
    cardHolderName: "Test User",
    expiryDate: "12/30",
    cvv: "123",
    ...overrides,
  });
