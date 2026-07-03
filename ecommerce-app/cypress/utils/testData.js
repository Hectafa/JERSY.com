/**
 * Genera un usuario único por ejecución para evitar colisiones de email
 * entre corridas (y entre pruebas dentro de la misma corrida).
 */
export function buildUniqueUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Usuario Cypress",
    email: `cypress-${unique}@example.com`,
    password: "Test1234!",
    phone: "5512345678",
    ...overrides,
  };
}

/**
 * Datos de una dirección de envío válida para el modelo real del backend
 * (Address: name, address, city, state, postalCode, country, phone) mapeados
 * a los nombres de campo que usa el formulario del frontend (AddressForm).
 */
export function buildShippingAddress(overrides = {}) {
  return {
    name: "Casa",
    address1: "Av. Siempre Viva 123",
    address2: "Depto 4B",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "01000",
    country: "México",
    phone: "5512345678",
    reference: "Portón negro",
    ...overrides,
  };
}

/**
 * Datos de un método de pago (tarjeta) válidos para PaymentForm.
 */
export function buildPaymentMethod(overrides = {}) {
  return {
    alias: "Tarjeta Cypress",
    cardNumber: "4111-1111-1111-1111",
    placeHolder: "Usuario Cypress",
    expiryDate: "12/29",
    cvv: "123",
    ...overrides,
  };
}
