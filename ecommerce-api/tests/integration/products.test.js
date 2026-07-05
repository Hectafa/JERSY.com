import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Product from "../../src/models/Product.js";
import { createAdmin, createUser, createProduct, createCategory, authHeader } from "../helpers/fixtures.js";

describe("GET /api/products", () => {
  it("lista solo productos con stock disponible y aplica paginación", async () => {
    await createProduct({ name: "Con stock", stock: 5 });
    await createProduct({ name: "Sin stock", stock: 0 });

    const res = await request(app).get("/api/products").query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Con stock");
    expect(res.body.pagination).toMatchObject({ currentPage: 1, totalResults: 1 });
  });
});

describe("GET /api/products/:id", () => {
  it("devuelve el detalle de un producto existente", async () => {
    const product = await createProduct({ name: "Detalle" });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Detalle", price: 100 });
  });

  it("devuelve 404 para un producto inexistente", async () => {
    const res = await request(app).get("/api/products/64b64f1f1f1f1f1f1f1f1f1f");
    expect(res.status).toBe(404);
  });

  it("devuelve 422 para un id con formato inválido", async () => {
    const res = await request(app).get("/api/products/no-es-un-id");
    expect(res.status).toBe(422);
  });
});

describe("GET /api/products/search", () => {
  it("filtra por texto, categoría y rango de precio", async () => {
    const category = await createCategory({ name: "Electrónica" });
    await createProduct({ name: "Laptop Pro", price: 15000, category: category._id });
    await createProduct({ name: "Mouse", price: 200, category: category._id });

    const res = await request(app)
      .get("/api/products/search")
      .query({ q: "Laptop", minPrice: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Laptop Pro");
  });
});

describe("POST /api/products (autorización)", () => {
  it("rechaza la creación sin token", async () => {
    const res = await request(app).post("/api/products").send({ name: "X", price: 10 });
    expect(res.status).toBe(401);
  });

  it("rechaza la creación de un usuario autenticado sin rol admin", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", authHeader(token))
      .send({ name: "X", price: 10 });

    expect(res.status).toBe(403);
  });

  it("permite la creación a un usuario admin y valida el precio", async () => {
    const { token } = await createAdmin();

    const invalid = await request(app)
      .post("/api/products")
      .set("Authorization", authHeader(token))
      .send({ name: "Producto inválido", price: -5 });
    expect(invalid.status).toBe(422);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", authHeader(token))
      .send({ name: "Producto nuevo", price: 250, stock: 3 });

    expect(res.status).toBe(201);
    const stored = await Product.findById(res.body._id);
    expect(stored).not.toBeNull();
    expect(stored.price).toBe(250);
  });
});

describe("DELETE /api/products/:id", () => {
  it("elimina un producto existente cuando lo pide un admin", async () => {
    const { token } = await createAdmin();
    const product = await createProduct();

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(204);
    expect(await Product.findById(product._id)).toBeNull();
  });
});
