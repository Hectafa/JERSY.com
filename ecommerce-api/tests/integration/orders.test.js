import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Order from "../../src/models/Order.js";
import {
  createUser,
  createAdmin,
  createProduct,
  createAddress,
  createPaymentMethod,
  authHeader,
} from "../helpers/fixtures.js";

const buildOrderPayload = async ({ user, address, paymentMethod, product, totalPrice }) => ({
  user: user._id,
  products: [{ productId: product._id, quantity: 2, price: product.price }],
  address: address._id,
  paymentMethod: paymentMethod._id,
  totalPrice,
  shippingCost: 0,
});

describe("POST /api/orders", () => {
  it("crea una orden válida con estado inicial 'pending'", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payload = await buildOrderPayload({
      user,
      address,
      paymentMethod,
      product,
      totalPrice: 200,
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.paymentStatus).toBe("pending");

    const stored = await Order.findById(res.body._id);
    expect(stored).not.toBeNull();
    // subtotal real 200 (2 x 100) + IVA 16% (32) + envío 0 = 232
    expect(stored.tax).toBe(32);
    expect(stored.totalPrice).toBe(232);
  });

  it("rechaza el payload cuando faltan productos, dirección o pago", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, totalPrice: 100 });

    expect(res.status).toBe(422);
  });

  it("rechaza la petición sin token", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(401);
  });

  // ANTES: este test se llamaba "[hallazgo] no recalcula totalPrice en el
  // servidor..." y esperaba `res.body.totalPrice === 1` (el valor falso
  // enviado por el cliente), documentando a propósito que orderController.
  // createOrder confiaba ciegamente en el totalPrice del payload. Ahora que
  // el controlador recalcula el total desde los precios reales de la BD
  // (subtotal + IVA 16% + envío), se renombró y se actualizó para esperar el
  // total correcto (232).
  it("recalcula totalPrice desde los precios reales de la BD, ignorando el valor enviado por el cliente", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payload = await buildOrderPayload({
      user,
      address,
      paymentMethod,
      product,
      totalPrice: 1, // el cliente envía un total falso; el real es 232 (200 + 16% IVA)
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(232);
  });

  // NUEVO: el total recalculado debe incluir el IVA y el shippingCost.
  it("incluye IVA y shippingCost en el totalPrice recalculado", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payload = {
      ...(await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 999 })),
      shippingCost: 50,
    };

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(201);
    // subtotal real 200 (2 x 100) + IVA 16% (32) + shippingCost 50 = 282
    expect(res.body.tax).toBe(32);
    expect(res.body.totalPrice).toBe(282);
  });

  // NUEVO: products[].price también se normaliza al precio real de la BD,
  // aunque el cliente mande un precio distinto.
  it("usa el precio real del producto en la BD aunque el cliente envíe products[].price distinto", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payload = {
      user: user._id,
      products: [{ productId: product._id, quantity: 2, price: 1 }], // precio falso
      address: address._id,
      paymentMethod: paymentMethod._id,
      totalPrice: 2,
      shippingCost: 0,
    };

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.products[0].price).toBe(100);
  });

  // NUEVO: si un productId no existe en la BD, la orden se rechaza.
  it("rechaza la orden cuando un productId no existe", async () => {
    const { user, token } = await createUser();
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payload = {
      user: user._id,
      products: [{ productId: "64b64f1f1f1f1f1f1f1f1f1f", quantity: 1, price: 100 }],
      address: address._id,
      paymentMethod: paymentMethod._id,
      totalPrice: 100,
      shippingCost: 0,
    };

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(404);
  });
});

// NUEVO: cubre el fix de prevención de duplicados (ventana de 60s + 409).
describe("POST /api/orders - prevención de duplicados", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rechaza una orden duplicada enviada dentro de la ventana de 60 segundos", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const payload = await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 200 });

    const first = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(second.status).toBe(409);
    expect(second.body.existingOrderId).toBe(first.body._id);
  });

  it("permite una orden idéntica fuera de la ventana de 60 segundos", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const payload = await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 200 });

    const first = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);
    expect(first.status).toBe(201);

    // Solo se mockea `Date` (no setTimeout/setInterval), para no interferir
    // con los timers internos del driver de MongoDB/Mongoose y evitar que
    // el test realmente espere 61s de reloj real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 61 * 1000);

    const second = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(second.status).toBe(201);
  });

  it("permite dos órdenes distintas del mismo usuario en la misma ventana", async () => {
    const { user, token } = await createUser();
    const productA = await createProduct({ price: 100 });
    const productB = await createProduct({ price: 50 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);

    const payloadA = await buildOrderPayload({
      user,
      address,
      paymentMethod,
      product: productA,
      totalPrice: 200,
    });
    const payloadB = await buildOrderPayload({
      user,
      address,
      paymentMethod,
      product: productB,
      totalPrice: 100,
    });

    const resA = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payloadA);
    const resB = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payloadB);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });
});

describe("GET /api/orders/:id", () => {
  it("devuelve la orden solicitada", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const payload = await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 200 });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    const res = await request(app)
      .get(`/api/orders/${created.body._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(created.body._id);
  });

  it("devuelve 404 para una orden inexistente", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .get("/api/orders/64b64f1f1f1f1f1f1f1f1f1f")
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(404);
  });

  // ANTES: este test se llamaba "[hallazgo] permite a cualquier usuario
  // autenticado ver la orden de otro usuario (sin validación de propiedad)" y
  // esperaba 200, documentando a propósito la vulnerabilidad real en
  // orderController.getOrderById (solo exigía authMiddleware, sin comparar
  // el dueño de la orden contra req.user.userId). Ahora que el controlador
  // valida propiedad, se renombró y se actualizó para esperar 403.
  it("rechaza a un usuario que no es dueño de la orden ni admin", async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(owner.user._id);
    const paymentMethod = await createPaymentMethod(owner.user._id);
    const payload = await buildOrderPayload({
      user: owner.user,
      address,
      paymentMethod,
      product,
      totalPrice: 200,
    });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(owner.token))
      .send(payload);

    const res = await request(app)
      .get(`/api/orders/${created.body._id}`)
      .set("Authorization", authHeader(otherUser.token));

    expect(res.status).toBe(403);
  });

  // NUEVO: cubre la rama del fix que sí permite ver la orden cuando el
  // solicitante es admin, aunque no sea el dueño.
  it("permite a un admin ver la orden de cualquier usuario", async () => {
    const owner = await createUser();
    const admin = await createAdmin();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(owner.user._id);
    const paymentMethod = await createPaymentMethod(owner.user._id);
    const payload = await buildOrderPayload({
      user: owner.user,
      address,
      paymentMethod,
      product,
      totalPrice: 200,
    });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(owner.token))
      .send(payload);

    const res = await request(app)
      .get(`/api/orders/${created.body._id}`)
      .set("Authorization", authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(created.body._id);
  });
});

describe("GET /api/orders/user/:id", () => {
  it("devuelve las órdenes del usuario ordenadas de la más reciente a la más antigua", async () => {
    const { user, token } = await createUser();
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const productA = await createProduct({ price: 100 });
    const productB = await createProduct({ price: 50 });

    const first = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(await buildOrderPayload({ user, address, paymentMethod, product: productA, totalPrice: 200 }));
    expect(first.status).toBe(201);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 61 * 1000);

    const second = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(await buildOrderPayload({ user, address, paymentMethod, product: productB, totalPrice: 100 }));
    expect(second.status).toBe(201);
    vi.useRealTimers();

    const res = await request(app)
      .get(`/api/orders/user/${user._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]._id).toBe(second.body._id);
    expect(res.body[1]._id).toBe(first.body._id);
  });

  it("rechaza con 403 a un usuario que consulta las órdenes de otro", async () => {
    const owner = await createUser();
    const otherUser = await createUser();

    const res = await request(app)
      .get(`/api/orders/user/${owner.user._id}`)
      .set("Authorization", authHeader(otherUser.token));

    expect(res.status).toBe(403);
  });

  it("permite a un admin ver las órdenes de cualquier usuario", async () => {
    const owner = await createUser();
    const admin = await createAdmin();
    const address = await createAddress(owner.user._id);
    const paymentMethod = await createPaymentMethod(owner.user._id);
    const product = await createProduct({ price: 100 });

    await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(owner.token))
      .send(await buildOrderPayload({ user: owner.user, address, paymentMethod, product, totalPrice: 200 }));

    const res = await request(app)
      .get(`/api/orders/user/${owner.user._id}`)
      .set("Authorization", authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("PUT /api/orders/:id", () => {
  it("actualiza el estado de la orden", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const payload = await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 200 });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    const res = await request(app)
      .put(`/api/orders/${created.body._id}`)
      .set("Authorization", authHeader(token))
      .send({ status: "shipped" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("shipped");
  });

  it("rechaza un estado inválido", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ price: 100 });
    const address = await createAddress(user._id);
    const paymentMethod = await createPaymentMethod(user._id);
    const payload = await buildOrderPayload({ user, address, paymentMethod, product, totalPrice: 200 });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", authHeader(token))
      .send(payload);

    const res = await request(app)
      .put(`/api/orders/${created.body._id}`)
      .set("Authorization", authHeader(token))
      .send({ status: "not-a-real-status" });

    expect(res.status).toBe(422);
  });
});
