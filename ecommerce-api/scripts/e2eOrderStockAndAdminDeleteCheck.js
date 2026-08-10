import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Address from "../src/models/Address.js";
import PaymentMethod from "../src/models/PaymentMethod.js";
import Order from "../src/models/Order.js";

dotenv.config({ quiet: true });

const API = "http://localhost:4000/api";
const PASSWORD = "Password123!";
const SUFFIX = Date.now();

let passCount = 0;
let failCount = 0;

function check(label, condition, extra) {
  if (condition) {
    passCount++;
    console.log(`OK   - ${label}`);
  } else {
    failCount++;
    console.log(`FAIL - ${label}${extra ? " -> " + JSON.stringify(extra) : ""}`);
  }
}

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // sin body (204)
  }
  return { status: res.status, data };
}

async function run() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
  );

  const cleanup = { userIds: [], productId: null, addressIds: [], paymentIds: [], orderIds: [] };

  try {
    // 1. Admin de prueba directo en la DB (el registro público siempre asigna "customer")
    const adminEmail = `e2e-admin-${SUFFIX}@test.local`;
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const adminUser = await User.create({
      name: "E2E Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });
    cleanup.userIds.push(adminUser._id);

    // 2. Dos compradores registrados vía la API real
    const buyerAEmail = `e2e-buyer-a-${SUFFIX}@test.local`;
    const buyerBEmail = `e2e-buyer-b-${SUFFIX}@test.local`;

    const regA = await api("POST", "/auth/register", null, {
      name: "E2E Buyer A", email: buyerAEmail, password: PASSWORD,
    });
    check("Registro comprador A", regA.status === 201, regA.data);

    const regB = await api("POST", "/auth/register", null, {
      name: "E2E Buyer B", email: buyerBEmail, password: PASSWORD,
    });
    check("Registro comprador B", regB.status === 201, regB.data);

    // 3. Login de los 3
    const loginAdmin = await api("POST", "/auth/login", null, { email: adminEmail, password: PASSWORD });
    check("Login admin", loginAdmin.status === 200, loginAdmin.data);
    const adminToken = loginAdmin.data?.token;

    const loginA = await api("POST", "/auth/login", null, { email: buyerAEmail, password: PASSWORD });
    check("Login comprador A", loginA.status === 200, loginA.data);
    const tokenA = loginA.data?.token;

    const loginB = await api("POST", "/auth/login", null, { email: buyerBEmail, password: PASSWORD });
    check("Login comprador B", loginB.status === 200, loginB.data);
    const tokenB = loginB.data?.token;

    const userA = await User.findOne({ email: buyerAEmail });
    const userB = await User.findOne({ email: buyerBEmail });
    cleanup.userIds.push(userA._id, userB._id);

    // 4. Producto de prueba con stock chico en una sola talla (CH: 2)
    const createProductRes = await api("POST", "/products", adminToken, {
      name: `E2E Stock Test ${SUFFIX}`,
      description: "Producto de prueba para verificar el descuento de stock",
      price: 100,
      sizes: [{ size: "CH", stock: 2 }],
    });
    check("Crear producto de prueba (admin)", createProductRes.status === 201, createProductRes.data);
    const productId = createProductRes.data?._id;
    cleanup.productId = productId;
    check("Stock inicial del producto = 2", createProductRes.data?.stock === 2, createProductRes.data);

    // 5. Direcciones y métodos de pago para A y B
    const addressPayload = (name, phone) => ({
      name, address: "Calle Falsa 123", city: "CDMX", state: "CDMX",
      postalCode: "01000", country: "México", phone,
    });

    const addrA = await api("POST", "/addresses", tokenA, addressPayload("Casa A", "5555555551"));
    check("Crear dirección comprador A", addrA.status === 201, addrA.data);
    cleanup.addressIds.push(addrA.data?._id);

    const addrB = await api("POST", "/addresses", tokenB, addressPayload("Casa B", "5555555552"));
    check("Crear dirección comprador B", addrB.status === 201, addrB.data);
    cleanup.addressIds.push(addrB.data?._id);

    const payA = await api("POST", "/payment-methods", tokenA, {
      user: userA._id.toString(), type: "credit_card", cardNumber: "4111111111111111",
    });
    check("Crear método de pago comprador A", payA.status === 201, payA.data);
    cleanup.paymentIds.push(payA.data?._id);

    const payB = await api("POST", "/payment-methods", tokenB, {
      user: userB._id.toString(), type: "credit_card", cardNumber: "4111111111111112",
    });
    check("Crear método de pago comprador B", payB.status === 201, payB.data);
    cleanup.paymentIds.push(payB.data?._id);

    // 6. Comprador A agota el stock (2 unidades talla CH)
    const orderA = await api("POST", "/orders", tokenA, {
      user: userA._id.toString(),
      products: [{ productId, size: "CH", quantity: 2, price: 100 }],
      address: addrA.data._id,
      paymentMethod: payA.data._id,
      totalPrice: 232,
      shippingCost: 0,
    });
    check("Comprador A agota el stock (2 CH) -> 201", orderA.status === 201, orderA.data);
    const orderAId = orderA.data?._id;
    if (orderAId) cleanup.orderIds.push(orderAId);

    // 7. El stock debe haber quedado en 0
    const productAfterA = await api("GET", `/products/${productId}`, tokenA, null);
    const chAfterA = productAfterA.data?.sizes?.find((s) => s.size === "CH");
    check("Stock talla CH = 0 tras el pedido de A", chAfterA?.stock === 0, productAfterA.data);
    check("Stock total del producto = 0 tras el pedido de A", productAfterA.data?.stock === 0, productAfterA.data);

    // 8. Comprador B intenta el mismo pedido -> debe ser rechazado
    const orderB = await api("POST", "/orders", tokenB, {
      user: userB._id.toString(),
      products: [{ productId, size: "CH", quantity: 2, price: 100 }],
      address: addrB.data._id,
      paymentMethod: payB.data._id,
      totalPrice: 232,
      shippingCost: 0,
    });
    check("Comprador B es rechazado por falta de stock -> 400", orderB.status === 400, orderB.data);

    // 9. El stock sigue en 0 (no bajó de 0 ni quedó en un estado raro)
    const productAfterB = await api("GET", `/products/${productId}`, tokenB, null);
    const chAfterB = productAfterB.data?.sizes?.find((s) => s.size === "CH");
    check("Stock talla CH sigue en 0 tras el intento fallido de B", chAfterB?.stock === 0, productAfterB.data);

    // 10. Panel admin: no se puede borrar un pedido pending
    const delPending = await api("DELETE", `/orders/${orderAId}`, adminToken, null);
    check("Admin NO puede borrar pedido pending -> 400", delPending.status === 400, delPending.data);

    // 11. shipped tampoco es borrable
    const toShipped = await api("PUT", `/orders/${orderAId}`, adminToken, { status: "shipped" });
    check("Admin cambia estado a shipped -> 200", toShipped.status === 200, toShipped.data);
    const delShipped = await api("DELETE", `/orders/${orderAId}`, adminToken, null);
    check("Admin NO puede borrar pedido shipped -> 400", delShipped.status === 400, delShipped.data);

    // 12. delivered sí es borrable
    const toDelivered = await api("PUT", `/orders/${orderAId}`, adminToken, { status: "delivered" });
    check("Admin cambia estado a delivered -> 200", toDelivered.status === 200, toDelivered.data);
    const delDelivered = await api("DELETE", `/orders/${orderAId}`, adminToken, null);
    check("Admin SÍ puede borrar pedido delivered -> 204", delDelivered.status === 204, delDelivered.data);
    const getDeleted = await api("GET", `/orders/${orderAId}`, adminToken, null);
    check("El pedido ya no existe tras borrarlo -> 404", getDeleted.status === 404, getDeleted.data);
    if (delDelivered.status === 204) cleanup.orderIds = cleanup.orderIds.filter((id) => id !== orderAId);

    // 13. Reponer stock y probar el camino "cancelled"
    const restock = await api("PUT", `/products/${productId}`, adminToken, {
      sizes: [{ size: "CH", stock: 1 }],
    });
    check("Admin repone stock del producto (1 CH)", restock.status === 200 && restock.data?.stock === 1, restock.data);

    const orderC = await api("POST", "/orders", tokenB, {
      user: userB._id.toString(),
      products: [{ productId, size: "CH", quantity: 1, price: 100 }],
      address: addrB.data._id,
      paymentMethod: payB.data._id,
      totalPrice: 116,
      shippingCost: 0,
    });
    check("Comprador B crea un pedido nuevo -> 201", orderC.status === 201, orderC.data);
    const orderCId = orderC.data?._id;
    if (orderCId) cleanup.orderIds.push(orderCId);

    const toCancelled = await api("PUT", `/orders/${orderCId}`, adminToken, { status: "cancelled" });
    check("Admin cancela el pedido -> 200", toCancelled.status === 200, toCancelled.data);
    const delCancelled = await api("DELETE", `/orders/${orderCId}`, adminToken, null);
    check("Admin SÍ puede borrar pedido cancelled -> 204", delCancelled.status === 204, delCancelled.data);
    if (delCancelled.status === 204) cleanup.orderIds = cleanup.orderIds.filter((id) => id !== orderCId);

    // 14. Un usuario que no es admin no puede borrar pedidos, aunque estén delivered
    const restock2 = await api("PUT", `/products/${productId}`, adminToken, {
      sizes: [{ size: "CH", stock: 1 }],
    });
    check("Admin repone stock otra vez (1 CH)", restock2.status === 200, restock2.data);

    const orderD = await api("POST", "/orders", tokenB, {
      user: userB._id.toString(),
      products: [{ productId, size: "CH", quantity: 1, price: 100 }],
      address: addrB.data._id,
      paymentMethod: payB.data._id,
      totalPrice: 116,
      shippingCost: 1, // distinto de orderC para no chocar con la detección de duplicados (60s)
    });
    check("Comprador B crea otro pedido -> 201", orderD.status === 201, orderD.data);
    const orderDId = orderD.data?._id;
    if (orderDId) cleanup.orderIds.push(orderDId);

    await api("PUT", `/orders/${orderDId}`, adminToken, { status: "delivered" });
    const nonAdminDelete = await api("DELETE", `/orders/${orderDId}`, tokenB, null);
    check("Un no-admin NO puede borrar pedidos -> 403", nonAdminDelete.status === 403, nonAdminDelete.data);
  } finally {
    console.log("\nLimpiando datos de prueba...");
    if (cleanup.orderIds.length) await Order.deleteMany({ _id: { $in: cleanup.orderIds } });
    if (cleanup.productId) await Product.findByIdAndDelete(cleanup.productId);
    const addressIds = cleanup.addressIds.filter(Boolean);
    if (addressIds.length) await Address.deleteMany({ _id: { $in: addressIds } });
    const paymentIds = cleanup.paymentIds.filter(Boolean);
    if (paymentIds.length) await PaymentMethod.deleteMany({ _id: { $in: paymentIds } });
    if (cleanup.userIds.length) await User.deleteMany({ _id: { $in: cleanup.userIds } });
    await mongoose.disconnect();
  }

  console.log(`\nResultado: ${passCount} OK, ${failCount} FALLOS`);
  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
