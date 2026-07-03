describe("Inicio de sesión", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/auth/login").as("loginRequest");
  });

  it("renderiza el formulario con correo, contraseña, botón de login y enlace a registro", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email-input"]').should("be.visible");
    cy.get('[data-testid="login-password-input"]').should("be.visible");
    cy.get('[data-testid="login-submit-button"]').should(
      "contain",
      "Iniciar Sesión",
    );
    cy.get('[data-testid="login-register-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/register");
    // Esta app no implementa recuperación de contraseña: no existe un
    // enlace "¿Olvidaste tu contraseña?" en LoginForm.jsx, por lo que no
    // se afirma su presencia (documentado también en docs/testing.md).
  });

  it("no permite enviar el formulario con campos vacíos (validación HTML5 nativa)", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email-input"]').should("have.attr", "required");
    cy.get('[data-testid="login-password-input"]').should(
      "have.attr",
      "required",
    );

    cy.get('[data-testid="login-submit-button"]').click();

    cy.get("@loginRequest.all").should("have.length", 0);
    cy.location("pathname").should("eq", "/login");
  });

  it("no envía el formulario con un correo con formato inválido", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email-input"]').type("no-es-un-correo");
    cy.get('[data-testid="login-password-input"]').type("cualquierClave");
    cy.get('[data-testid="login-submit-button"]').click();

    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("muestra un mensaje de error con credenciales incorrectas y no deja sesión activa", () => {
    cy.registerByApi().then((user) => {
      cy.visit("/login");

      cy.get('[data-testid="login-email-input"]').type(user.email);
      cy.get('[data-testid="login-password-input"]').type("ClaveIncorrecta1");
      cy.get('[data-testid="login-submit-button"]').click();

      cy.wait("@loginRequest").its("response.statusCode").should("eq", 400);

      cy.get('[data-testid="login-error-message"]').should(
        "contain",
        "Email o contraseña incorrectos.",
      );
      cy.get('[data-testid="login-submit-button"]')
        .should("not.be.disabled")
        .and("contain", "Iniciar Sesión");
      cy.window().then((win) => {
        expect(win.localStorage.getItem("authToken")).to.be.null;
      });
    });
  });

  it("inicia sesión exitosamente, redirige y muestra la información del usuario", () => {
    cy.registerByApi().then((user) => {
      cy.visit("/login");

      cy.get('[data-testid="login-email-input"]').type(user.email);
      cy.get('[data-testid="login-password-input"]').type(user.password);
      cy.get('[data-testid="login-submit-button"]').click();

      cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);

      cy.location("pathname").should("eq", "/");
      cy.contains(`Hola, ${user.name}`).should("be.visible");
      cy.window().then((win) => {
        expect(win.localStorage.getItem("authToken")).to.exist;
      });
    });
  });

  it("mantiene la sesión iniciada tras recargar la página y al visitar una ruta protegida", () => {
    cy.registerByApi().then((user) => {
      cy.loginByApi({ email: user.email, password: user.password });

      cy.reload();
      cy.contains(`Hola, ${user.name}`).should("be.visible");

      cy.visit("/orders");
      cy.location("pathname").should("eq", "/orders");
      cy.contains("Acceso denegado").should("not.exist");
    });
  });

  it("redirige a /login al intentar visitar una ruta protegida sin sesión", () => {
    cy.clearAllLocalStorage();
    cy.visit("/orders");

    cy.location("pathname").should("eq", "/login");
    cy.contains("Mis pedidos").should("not.exist");
  });
});
