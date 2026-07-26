import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Category from "../../src/models/Category.js";
import { createCategory, createProduct } from "../helpers/fixtures.js";

describe("GET /api/categories", () => {
  it("lista todas las categorías", async () => {
    await createCategory({ name: "Electrónica" });
    await createCategory({ name: "Ropa" });

    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /api/categories/:id/products", () => {
  it("incluye los productos de una categoría raíz y de sus subcategorías", async () => {
    const parent = await createCategory({ name: "Electrónica" });
    const child = await Category.create({
      name: "Laptops",
      description: "Subcategoría",
      parentCategory: parent._id,
    });
    await createProduct({ name: "Cargador", category: parent._id });
    await createProduct({ name: "Laptop Pro", category: child._id });
    await createProduct({ name: "Otra categoría", category: (await createCategory())._id });

    const res = await request(app).get(`/api/categories/${parent._id}/products`);

    expect(res.status).toBe(200);
    expect(res.body.products.map((p) => p.name).sort()).toEqual(
      ["Cargador", "Laptop Pro"].sort(),
    );
  });

  it("popula parentCategory para que el frontend pueda mostrar 'Padre: Hija'", async () => {
    const parent = await createCategory({ name: "Clubes" });
    const child = await Category.create({
      name: "Liga MX",
      description: "Subcategoría",
      parentCategory: parent._id,
    });

    const res = await request(app).get(`/api/categories/${child._id}/products`);

    expect(res.status).toBe(200);
    expect(res.body.category.parentCategory).toMatchObject({
      _id: parent._id.toString(),
      name: "Clubes",
    });
  });

  it("devuelve 404 para una categoría inexistente", async () => {
    const res = await request(app).get(
      "/api/categories/64b64f1f1f1f1f1f1f1f1f1f/products",
    );
    expect(res.status).toBe(404);
  });

  it("devuelve 422 para un id con formato inválido", async () => {
    const res = await request(app).get("/api/categories/no-es-un-id/products");
    expect(res.status).toBe(422);
  });
});
