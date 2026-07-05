import { describe, it, expect } from "vitest";
import { createCartValidation, putCartValidation } from "../../../src/validators/cartValidators.js";
import { runValidation, fakeReq } from "../helpers/runValidation.js";

const validUser = "64b64f1f1f1f1f1f1f1f1f1f";
const validProduct = "64b64f1f1f1f1f1f1f1f1f20";

describe("createCartValidation", () => {
  it("acepta un carrito válido con productos", async () => {
    const result = await runValidation(
      createCartValidation,
      fakeReq({ body: { user: validUser, products: [{ product: validProduct, quantity: 2 }] } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza cuando falta el usuario", async () => {
    const result = await runValidation(createCartValidation, fakeReq({ body: { products: [] } }));
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza una cantidad menor a 1", async () => {
    const result = await runValidation(
      createCartValidation,
      fakeReq({ body: { user: validUser, products: [{ product: validProduct, quantity: 0 }] } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un product id con formato inválido", async () => {
    const result = await runValidation(
      createCartValidation,
      fakeReq({ body: { user: validUser, products: [{ product: "no-es-un-id", quantity: 1 }] } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});

describe("putCartValidation", () => {
  it("exige que products sea obligatorio (a diferencia de createCartValidation)", async () => {
    const result = await runValidation(
      putCartValidation,
      fakeReq({ params: { id: validUser }, body: { user: validUser } }),
    );
    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((e) => e.path === "products")).toBe(true);
  });

  it("acepta una actualización válida", async () => {
    const result = await runValidation(
      putCartValidation,
      fakeReq({
        params: { id: validUser },
        body: { user: validUser, products: [{ product: validProduct, quantity: 3 }] },
      }),
    );
    expect(result.isEmpty()).toBe(true);
  });
});
