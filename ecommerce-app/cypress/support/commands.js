import { buildUniqueUser } from "../utils/testData";

/**
 * Registra un usuario nuevo directamente vía la API real
 * (POST /api/auth/register) y devuelve las credenciales usadas.
 * Sirve como precondición rápida para pruebas que necesitan un usuario
 * autenticado sin pasar por el formulario de UI (p.ej. checkout.cy.js).
 *
 * NOTA: /auth/register NO devuelve un token (el backend real no lo incluye
 * en la respuesta), por lo que después de registrar hay que iniciar sesión
 * por separado con cy.loginByApi().
 */
Cypress.Commands.add("registerByApi", (overrides = {}) => {
  const user = buildUniqueUser(overrides);

  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/register`,
      body: {
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status !== 201) {
        throw new Error(
          `cy.registerByApi: el registro falló (status ${response.status}): ${JSON.stringify(
            response.body,
          )}`,
        );
      }
      return user;
    });
});

/**
 * Inicia sesión directamente vía la API real (POST /api/auth/login),
 * evitando pasar por la interfaz, y deja la app con la sesión restaurada
 * (mismo mecanismo que usa AuthContext: localStorage["authToken"]).
 * Usa cy.session() para cachear la sesión entre pruebas del mismo email.
 *
 * Uso:
 *   cy.loginByApi({ email, password });
 *   cy.loginByApi(); // usa Cypress.env('TEST_USER_EMAIL'/'TEST_USER_PASSWORD')
 */
Cypress.Commands.add("loginByApi", ({ email, password } = {}) => {
  const creds = {
    email: email || Cypress.env("TEST_USER_EMAIL"),
    password: password || Cypress.env("TEST_USER_PASSWORD"),
  };

  if (!creds.email || !creds.password) {
    throw new Error(
      "cy.loginByApi requiere { email, password } o las variables de entorno " +
        "CYPRESS_TEST_USER_EMAIL / CYPRESS_TEST_USER_PASSWORD.",
    );
  }

  cy.session(
    [creds.email],
    () => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: creds,
        failOnStatusCode: false,
        log: false,
      }).then((response) => {
        if (response.status !== 200 || !response.body?.token) {
          throw new Error(
            `cy.loginByApi: login falló (status ${response.status}). ` +
              "Verifica que el usuario exista (usa cy.registerByApi primero) " +
              "y que las credenciales sean correctas.",
          );
        }

        // Visitamos el origen de la app ANTES de escribir en localStorage
        // para que cy.session capture el storage bajo el origen correcto
        // (http://localhost:3000), tal como lo hace AuthContext en runtime.
        cy.visit("/");
        cy.window().then((win) => {
          win.localStorage.setItem("authToken", response.body.token);
        });
      });
    },
    {
      validate() {
        cy.window().then((win) => {
          expect(
            win.localStorage.getItem("authToken"),
            "authToken en localStorage",
          ).to.exist;
        });
      },
    },
  );

  cy.visit("/");
});

/**
 * Obtiene un producto real y con stock desde el catálogo (GET /api/products)
 * para usarlo como precondición en otras pruebas, sin inventar IDs.
 * Falla con un mensaje claro si el catálogo está vacío (recuerda ejecutar
 * `npm run seedProducts` en ecommerce-api antes de correr la suite E2E).
 */
Cypress.Commands.add("getSeededProduct", () => {
  return cy
    .request(`${Cypress.env("apiUrl")}/products?limit=1`)
    .then(({ body }) => {
      const product = body.products?.[0];
      if (!product) {
        throw new Error(
          "cy.getSeededProduct: el catálogo está vacío. Ejecuta " +
            "`npm run seedProducts` dentro de ecommerce-api antes de correr Cypress.",
        );
      }
      return product;
    });
});

/**
 * Agrega un producto al carrito navegando por la interfaz real (detalle de
 * producto -> botón "Agregar al carrito"). ProductDetails no expone un
 * input de cantidad (siempre agrega de 1 en 1), así que para cantidades > 1
 * el comando hace clic en el botón la cantidad de veces solicitada.
 *
 * Verifica que: el producto quedó en el carrito, la cantidad es correcta,
 * el contador del header se actualizó y el subtotal coincide con
 * precio * cantidad.
 *
 * Uso:
 *   cy.addProductToCart({ productId, quantity: 2 });
 */
Cypress.Commands.add("addProductToCart", ({ productId, size, quantity = 1 }) => {
  if (!productId) {
    throw new Error("cy.addProductToCart requiere { productId }");
  }

  cy.request(`${Cypress.env("apiUrl")}/products/${productId}`).then(
    ({ body: product }) => {
      cy.visit(`/product/${productId}`);
      cy.get('[data-testid="product-detail"]').should("be.visible");

      if (product.sizes?.length) {
        if (!size) {
          throw new Error(
            `cy.addProductToCart: el producto ${productId} tiene tallas, pasa { size } (usa la misma que cy.getSeededProduct/this.size).`,
          );
        }
        cy.get(`[data-testid="size-option-${size}"]`).click();
      }

      // El carrito identifica cada línea como `productId-size` cuando el
      // producto tiene tallas (ver getItemKey en CartContext.jsx), así que
      // los data-testid de cart-item deben incluir la talla también.
      const itemKey = size ? `${productId}-${size}` : productId;

      Cypress._.times(quantity, () => {
        cy.get('[data-testid="add-to-cart-button"]').click();
      });

      cy.get('[data-testid="cart-count"]').should(
        "have.text",
        String(quantity),
      );

      cy.visit("/cart");
      cy.get(`[data-testid="cart-item-${itemKey}"]`).should("be.visible");
      cy.get(`[data-testid="cart-item-quantity-${itemKey}"]`).should(
        "have.text",
        String(quantity),
      );

      const expectedSubtotal = (product.price * quantity).toFixed(2);
      cy.get('[data-testid="cart-subtotal"]').should(
        "contain",
        expectedSubtotal,
      );
    },
  );
});
