import apiClient from "./apiClient";
import {
  getShippingAddresses,
  getDefaultShippingAddress,
  createAddress,
  updateAddress,
  deleteAddress,
} from "./shippingService";

jest.mock("./apiClient");

describe("shippingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getShippingAddresses desenvuelve data.addresses (forma real del backend)", async () => {
    apiClient.get.mockResolvedValue({ data: { addresses: [{ _id: "a1" }] } });

    const result = await getShippingAddresses();

    expect(apiClient.get).toHaveBeenCalledWith("/addresses");
    expect(result).toEqual([{ _id: "a1" }]);
  });

  test("getShippingAddresses devuelve [] si data.addresses no existe", async () => {
    apiClient.get.mockResolvedValue({ data: {} });

    const result = await getShippingAddresses();

    expect(result).toEqual([]);
  });

  test("getDefaultShippingAddress devuelve la dirección marcada isDefault", async () => {
    apiClient.get.mockResolvedValue({
      data: { addresses: [{ _id: "a1", isDefault: false }, { _id: "a2", isDefault: true }] },
    });

    const result = await getDefaultShippingAddress();

    expect(result).toEqual({ _id: "a2", isDefault: true });
  });

  test("getDefaultShippingAddress usa la primera si ninguna es default", async () => {
    apiClient.get.mockResolvedValue({
      data: { addresses: [{ _id: "a1", isDefault: false }] },
    });

    const result = await getDefaultShippingAddress();

    expect(result).toEqual({ _id: "a1", isDefault: false });
  });

  test("getDefaultShippingAddress devuelve null sin direcciones", async () => {
    apiClient.get.mockResolvedValue({ data: { addresses: [] } });

    const result = await getDefaultShippingAddress();

    expect(result).toBeNull();
  });

  test("createAddress llama POST /addresses", async () => {
    apiClient.post.mockResolvedValue({ data: { _id: "a1" } });

    await createAddress({ address: "Calle 1", city: "CDMX" });

    expect(apiClient.post).toHaveBeenCalledWith("/addresses", { address: "Calle 1", city: "CDMX" });
  });

  test("updateAddress llama PUT /addresses/:id", async () => {
    apiClient.put.mockResolvedValue({ data: { _id: "a1" } });

    await updateAddress("a1", { city: "Guadalajara" });

    expect(apiClient.put).toHaveBeenCalledWith("/addresses/a1", { city: "Guadalajara" });
  });

  test("deleteAddress llama DELETE /addresses/:id", async () => {
    apiClient.delete.mockResolvedValue({});

    await deleteAddress("a1");

    expect(apiClient.delete).toHaveBeenCalledWith("/addresses/a1");
  });
});
