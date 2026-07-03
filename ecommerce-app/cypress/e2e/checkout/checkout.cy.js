import { buildPaymentMethod, buildShippingAddress } from "../../utils/testData";

/**
 * El checkout real de esta app NO es un wizard de rutas separadas: es una
 * sola página (/checkout) con un acordeón de 3 secciones (dirección, pago,
 * revisión) + un panel de resumen/confirmación a la derecha. Este spec
 * prueba las "4 fases" pedidas como sus bloques funcionales equivalentes:
 *   Fase 1 -> carrito y productos (página /cart, antes de entrar a checkout)
 *   Fase 2 -> checkout-address-section (formulario de dirección real)
 *   Fase 3 -> checkout-payment-section (formulario de método de pago real)
 *   Fase 4 -> checkout-review-section + panel de resumen/confirmación
 */
describe("Checkout - flujo completo en 4 fases", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/products*").as("getProducts");
    cy.intercept("POST", "**/addresses").as("createAddress");
    cy.intercept("POST", "**/payment-methods").as("createPayment");
    cy.intercept("POST", "**/orders").as("createOrder");

    cy.registerByApi().then((user) => {
      cy.wrap(user).as("user");
      cy.loginByApi({ email: user.email, password: user.password });
    });
    cy.getSeededProduct().then((product) => cy.wrap(product).as("product"));
  });

  describe("Fase 1: carrito y productos", () => {
    it("agrega un producto, muestra su información y permite modificar cantidad", function () {
      cy.addProductToCart({ productId: this.product._id, quantity: 1 });

      cy.get(`[data-testid="cart-item-${this.product._id}"]`).within(() => {
        cy.contains(this.product.name).should("be.visible");
        cy.contains(`$${this.product.price.toFixed(2)}`).should("be.visible");
      });

      cy.get(`[data-testid="cart-item-increase-${this.product._id}"]`).click();
      cy.get(`[data-testid="cart-item-quantity-${this.product._id}"]`).should(
        "have.text",
        "2",
      );
      cy.get('[data-testid="cart-subtotal"]').should(
        "contain",
        (this.product.price * 2).toFixed(2),
      );

      cy.get(`[data-testid="cart-item-decrease-${this.product._id}"]`).click();
      cy.get(`[data-testid="cart-item-quantity-${this.product._id}"]`).should(
        "have.text",
        "1",
      );
    });

    it("elimina un producto del carrito", function () {
      cy.addProductToCart({ productId: this.product._id, quantity: 1 });

      cy.get(`[data-testid="cart-item-remove-${this.product._id}"]`).click();

      cy.get('[data-testid="cart-empty"]').should("be.visible");
    });

    it("impide continuar al checkout con el carrito vacío", () => {
      cy.clearAllLocalStorage();
      cy.loginByApi();
      cy.visit("/cart");
      cy.get('[data-testid="cart-empty"]').should("be.visible");
      cy.visit("/checkout");
      cy.location("pathname").should("eq", "/cart");
    });

    it("permite continuar al checkout cuando hay productos", function () {
      cy.addProductToCart({ productId: this.product._id, quantity: 1 });
      cy.visit("/cart");
      cy.get('[data-testid="cart-checkout-button"]')
        .should("not.be.disabled")
        .click();
      cy.location("pathname").should("eq", "/checkout");
    });
  });

  describe("Fases 2 a 4: dirección, pago, revisión y confirmación", () => {
    it("completa dirección, pago y confirma una orden real", function () {
      const address = buildShippingAddress();
      const payment = buildPaymentMethod();

      cy.addProductToCart({ productId: this.product._id, quantity: 2 });
      cy.visit("/checkout");

      // --- Fase 2: dirección de envío ---
      cy.get('[data-testid="checkout-address-section"]').within(() => {
        cy.get('[data-testid="checkout-address-name-input"]').type(
          address.name,
        );
        cy.get('[data-testid="checkout-address-line1-input"]').type(
          address.address1,
        );
        cy.get('[data-testid="checkout-address-city-input"]').type(
          address.city,
        );
        cy.get('[data-testid="checkout-address-state-input"]').type(
          address.state,
        );
        cy.get('[data-testid="checkout-address-postal-code-input"]').type(
          address.postalCode,
        );
        cy.get('[data-testid="checkout-address-country-input"]').type(
          address.country,
        );
        cy.get('[data-testid="checkout-address-phone-input"]').type(
          address.phone,
        );
        cy.get('[data-testid="checkout-address-submit-button"]').click();
      });
      cy.wait("@createAddress").its("response.statusCode").should("eq", 201);
      cy.contains(address.name).should("be.visible");

      // Los datos capturados se conservan al pasar a la siguiente sección
      // (no se pierden al colapsar el acordeón de dirección).
      cy.get('[data-testid="checkout-payment-section"]').should(
        "be.visible",
      );

      // --- Fase 3: método de pago ---
      cy.get('[data-testid="checkout-payment-section"]').within(() => {
        cy.get('[data-testid="checkout-payment-alias-input"]').type(
          payment.alias,
        );
        cy.get('[data-testid="checkout-payment-card-number-input"]').type(
          payment.cardNumber,
        );
        cy.get('[data-testid="checkout-payment-holder-input"]').type(
          payment.placeHolder,
        );
        cy.get('[data-testid="checkout-payment-expiry-input"]').type(
          payment.expiryDate,
        );
        cy.get('[data-testid="checkout-payment-cvv-input"]').type(
          payment.cvv,
        );
        cy.get('[data-testid="checkout-payment-submit-button"]').click();
      });
      cy.wait("@createPayment").its("response.statusCode").should("eq", 201);
      cy.contains(payment.alias).should("be.visible");

      // --- Fase 4: revisión y confirmación ---
      cy.get('[data-testid="checkout-review-section"]').within(() => {
        cy.get(`[data-testid="cart-item-${this.product._id}"]`).should(
          "be.visible",
        );
      });

      cy.get('[data-testid="checkout-order-summary"]').within(() => {
        cy.contains(address.name).should("be.visible");
        cy.contains(payment.alias).should("be.visible");
        cy.get('[data-testid="checkout-total"]').should("be.visible");
      });

      cy.get('[data-testid="checkout-confirm-button"]')
        .should("not.be.disabled")
        .click();

      cy.wait("@createOrder").then((interception) => {
        expect(interception.response.statusCode).to.eq(201);
        expect(interception.request.body).to.include.keys(
          "user",
          "products",
          "address",
          "paymentMethod",
          "totalPrice",
          "shippingCost",
        );
        expect(interception.request.body.products).to.have.length(1);
        expect(interception.request.body.products[0]).to.include({
          productId: this.product._id,
          quantity: 2,
        });
      });

      // Solo se crea UNA orden.
      cy.get("@createOrder.all").should("have.length", 1);

      cy.location("pathname").should("eq", "/order-confirmation");
      cy.get('[data-testid="order-success"]').should("be.visible");
      cy.get('[data-testid="order-number"]').should("not.be.empty");

      // El carrito quedó vacío tras confirmar.
      cy.visit("/cart");
      cy.get('[data-testid="cart-empty"]').should("be.visible");
    });

    it("no duplica la orden si se recarga la página de confirmación", function () {
      const address = buildShippingAddress();
      const payment = buildPaymentMethod();

      cy.addProductToCart({ productId: this.product._id, quantity: 1 });
      cy.visit("/checkout");

      cy.get('[data-testid="checkout-address-name-input"]').type(address.name);
      cy.get('[data-testid="checkout-address-line1-input"]').type(
        address.address1,
      );
      cy.get('[data-testid="checkout-address-city-input"]').type(address.city);
      cy.get('[data-testid="checkout-address-state-input"]').type(
        address.state,
      );
      cy.get('[data-testid="checkout-address-postal-code-input"]').type(
        address.postalCode,
      );
      cy.get('[data-testid="checkout-address-country-input"]').type(
        address.country,
      );
      cy.get('[data-testid="checkout-address-phone-input"]').type(
        address.phone,
      );
      cy.get('[data-testid="checkout-address-submit-button"]').click();
      cy.wait("@createAddress");

      cy.get('[data-testid="checkout-payment-alias-input"]').type(
        payment.alias,
      );
      cy.get('[data-testid="checkout-payment-card-number-input"]').type(
        payment.cardNumber,
      );
      cy.get('[data-testid="checkout-payment-holder-input"]').type(
        payment.placeHolder,
      );
      cy.get('[data-testid="checkout-payment-expiry-input"]').type(
        payment.expiryDate,
      );
      cy.get('[data-testid="checkout-payment-cvv-input"]').type(payment.cvv);
      cy.get('[data-testid="checkout-payment-submit-button"]').click();
      cy.wait("@createPayment");

      cy.get('[data-testid="checkout-confirm-button"]').click();
      cy.wait("@createOrder");
      cy.location("pathname").should("eq", "/order-confirmation");

      // Recargar la página de confirmación no debe volver a llamar a
      // POST /orders (no queda ningún efecto que reenvíe el pedido).
      cy.reload();
      cy.get("@createOrder.all").should("have.length", 1);
    });
  });
});
