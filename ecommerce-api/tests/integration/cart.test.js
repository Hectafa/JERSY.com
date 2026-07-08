import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, createProduct, authHeader } from "../helpers/fixtures.js";

describe("POST /api/cart", () => {
  it("rechaza la petición sin token", async () => {
    const res = await request(app).post("/api/cart").send({ user: "64b64f1f1f1f1f1f1f1f1f1f", products: [] });
    expect(res.status).toBe(401);
  });

  it("crea un carrito con un producto válido", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 5 });

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(2);
  });

  it("rechaza una cantidad menor a 1 (422 por express-validator, antes de llegar al controlador)", async () => {
    const { user, token } = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 0 }] });

    expect(res.status).toBe(422);
  });

  it("rechaza un producto con id inválido", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: "no-es-un-id", quantity: 1 }] });

    expect(res.status).toBe(422);
  });

  // NUEVO: cubre el fix que agrega validación de stock disponible en createCart/updateCart.
  it("rechaza cuando la cantidad solicitada excede el stock disponible", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 2 });

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 5 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });
});

// NUEVO: cubre el fix que expone addProductToCart como POST /api/cart/add
// (antes era código muerto, sin ruta, y con un bug de populate).
describe("POST /api/cart/add", () => {
  it("rechaza la petición sin token", async () => {
    const res = await request(app)
      .post("/api/cart/add")
      .send({ userId: "64b64f1f1f1f1f1f1f1f1f1f", productId: "64b64f1f1f1f1f1f1f1f1f1f" });
    expect(res.status).toBe(401);
  });

  it("crea un carrito nuevo cuando el usuario todavía no tiene uno", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 5 });

    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(2);
    expect(res.body.products[0].product._id).toBe(String(product._id));
  });

  it("incrementa la cantidad si el producto ya está en el carrito", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 10 });

    await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id, quantity: 2 });

    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id, quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(5);
  });

  it("rechaza cuando la cantidad final excede el stock disponible", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 3 });

    await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id, quantity: 2 });

    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id, quantity: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });

  it("rechaza un productId inválido", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: "no-es-un-id" });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/cart/user/:id", () => {
  it("devuelve 404 cuando el usuario no tiene carrito", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .get(`/api/cart/user/${user._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/cart/:id", () => {
  it("actualiza la cantidad de un producto en el carrito", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 10 });

    const created = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 1 }] });

    const res = await request(app)
      .put(`/api/cart/${created.body._id}`)
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 4 }] });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(4);
  });

  // NUEVO: mismo fix de validación de stock, ahora para la actualización del carrito.
  it("rechaza actualizar a una cantidad que excede el stock disponible", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ stock: 3 });

    const created = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 1 }] });

    const res = await request(app)
      .put(`/api/cart/${created.body._id}`)
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 10 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });
});

describe("DELETE /api/cart/:id", () => {
  it("elimina el carrito existente", async () => {
    const { user, token } = await createUser();
    const product = await createProduct();

    const created = await request(app)
      .post("/api/cart")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, products: [{ product: product._id, quantity: 1 }] });

    const res = await request(app)
      .delete(`/api/cart/${created.body._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(204);
  });

  it("devuelve 400 al eliminar un carrito inexistente", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .delete("/api/cart/64b64f1f1f1f1f1f1f1f1f1f")
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(400);
  });
});
