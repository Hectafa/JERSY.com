import { describe, it, expect } from "vitest";
import {
  productIdValidation,
  createProductValidation,
  updateProductValidation,
} from "../../../src/validators/productValidators.js";
import { runValidation, fakeReq } from "../helpers/runValidation.js";

describe("productIdValidation", () => {
  it("acepta un ObjectId válido", async () => {
    const result = await runValidation(
      productIdValidation,
      fakeReq({ params: { id: "64b64f1f1f1f1f1f1f1f1f1f" } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un id con formato inválido", async () => {
    const result = await runValidation(productIdValidation, fakeReq({ params: { id: "no-es-un-id" } }));
    expect(result.isEmpty()).toBe(false);
  });
});

describe("createProductValidation", () => {
  it("acepta un producto válido", async () => {
    const result = await runValidation(
      createProductValidation,
      fakeReq({ body: { name: "Laptop", price: 1000 } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza cuando falta el nombre", async () => {
    const result = await runValidation(createProductValidation, fakeReq({ body: { price: 1000 } }));
    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((e) => e.path === "name")).toBe(true);
  });

  it("rechaza cuando falta el precio", async () => {
    const result = await runValidation(createProductValidation, fakeReq({ body: { name: "Laptop" } }));
    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((e) => e.path === "price")).toBe(true);
  });

  it("rechaza un precio negativo", async () => {
    const result = await runValidation(
      createProductValidation,
      fakeReq({ body: { name: "Laptop", price: -10 } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza una categoría con formato inválido", async () => {
    const result = await runValidation(
      createProductValidation,
      fakeReq({ body: { name: "Laptop", price: 100, category: "no-es-un-id" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});

describe("updateProductValidation", () => {
  it("acepta una actualización parcial válida", async () => {
    const result = await runValidation(
      updateProductValidation,
      fakeReq({ params: { id: "64b64f1f1f1f1f1f1f1f1f1f" }, body: { stock: 5 } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un stock negativo", async () => {
    const result = await runValidation(
      updateProductValidation,
      fakeReq({ params: { id: "64b64f1f1f1f1f1f1f1f1f1f" }, body: { stock: -1 } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un nombre vacío cuando se envía explícitamente", async () => {
    const result = await runValidation(
      updateProductValidation,
      fakeReq({ params: { id: "64b64f1f1f1f1f1f1f1f1f1f" }, body: { name: "" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});
