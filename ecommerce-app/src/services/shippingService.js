import shippingAddresses from "../data/shipping-address.json";

// Seguir el mismo patrón que otros servicios: retornar una Promise con delay
export function getShippingAddresses() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(shippingAddresses || []);
    }, 600); // pequeño delay simulado
  });
}

export async function getDefaultShippingAddress() {
  const addresses = await getShippingAddresses();
  return addresses.find((a) => a.default) || addresses[0] || null;
}
