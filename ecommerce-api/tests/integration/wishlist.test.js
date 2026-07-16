import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, createProduct, authHeader } from "../helpers/fixtures.js";

describe("POST /api/wishlist", () => {
  it("rechaza la petición sin token", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .send({ userId: "64b64f1f1f1f1f1f1f1f1f1f", productId: "64b64f1f1f1f1f1f1f1f1f1f" });

    expect(res.status).toBe(401);
  });

  it("crea una wishlist nueva cuando el usuario todavía no tiene una", async () => {
    const { user, token } = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0]._id).toBe(String(product._id));
  });

  it("no duplica un producto que ya está en la wishlist", async () => {
    const { user, token } = await createUser();
    const product = await createProduct();

    await request(app)
      .post("/api/wishlist")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id });

    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id });

    expect(res.status).toBe(200);
    expect(res.body.wishlist.products).toHaveLength(1);
  });
});

describe("GET /api/wishlist/user/:id", () => {
  it("devuelve 404 cuando el usuario no tiene wishlist", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .get(`/api/wishlist/user/${user._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(404);
  });

  it("devuelve la wishlist del usuario con los productos poblados", async () => {
    const { user, token } = await createUser();
    const product = await createProduct({ name: "Deseado" });

    await request(app)
      .post("/api/wishlist")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id });

    const res = await request(app)
      .get(`/api/wishlist/user/${user._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.products[0].name).toBe("Deseado");
  });
});

describe("DELETE /api/wishlist/:id/product", () => {
  it("quita un producto de la wishlist", async () => {
    const { user, token } = await createUser();
    const product = await createProduct();

    const created = await request(app)
      .post("/api/wishlist")
      .set("Authorization", authHeader(token))
      .send({ userId: user._id, productId: product._id });

    const res = await request(app)
      .delete(`/api/wishlist/${created.body._id}/product`)
      .set("Authorization", authHeader(token))
      .send({ productId: product._id });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});
