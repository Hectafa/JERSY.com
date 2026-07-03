import { buildUniqueUser } from "../../utils/testData";

describe("Registro de usuario", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/auth/register").as("registerRequest");
    cy.visit("/register");
  });

  it("renderiza el formulario completo con todos sus campos", () => {
    cy.get('[data-testid="register-form"]').should("be.visible");
    cy.get('[data-testid="register-name-input"]').should("be.visible");
    cy.get('[data-testid="register-email-input"]').should("be.visible");
    cy.get('[data-testid="register-password-input"]').should("be.visible");
    cy.get('[data-testid="register-confirm-password-input"]').should(
      "be.visible",
    );
    cy.get('[data-testid="register-phone-input"]').should("be.visible");
    cy.get('[data-testid="register-submit-button"]').should(
      "contain",
      "Crear cuenta",
    );
    cy.get('[data-testid="register-login-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/login");
  });

  it("muestra errores de validación al enviar el formulario vacío y no llama al backend", () => {
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-name-error"]').should(
      "contain",
      "El nombre es requerido",
    );
    cy.get('[data-testid="register-email-error"]').should(
      "contain",
      "El email es requerido",
    );
    cy.get('[data-testid="register-password-error"]').should(
      "contain",
      "El password es requerido",
    );
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("muestra un error de formato cuando el correo es inválido y no envía el formulario", () => {
    const user = buildUniqueUser();
    cy.get('[data-testid="register-name-input"]').type(user.name);
    cy.get('[data-testid="register-email-input"]').type("correo-no-valido");
    cy.get('[data-testid="register-password-input"]').type(user.password);
    cy.get('[data-testid="register-confirm-password-input"]').type(
      user.password,
    );
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-email-error"]').should(
      "contain",
      "El email no tiene un formato válido",
    );
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("muestra un error cuando las contraseñas no coinciden y no envía el formulario", () => {
    const user = buildUniqueUser();
    cy.get('[data-testid="register-name-input"]').type(user.name);
    cy.get('[data-testid="register-email-input"]').type(user.email);
    cy.get('[data-testid="register-password-input"]').type(user.password);
    cy.get('[data-testid="register-confirm-password-input"]').type(
      "OtraClaveDistinta1",
    );
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-confirm-password-error"]').should(
      "contain",
      "Las contraseñas no coinciden",
    );
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("registra exitosamente con un correo único y redirige a login", () => {
    const user = buildUniqueUser();

    cy.get('[data-testid="register-name-input"]').type(user.name);
    cy.get('[data-testid="register-email-input"]').type(user.email);
    cy.get('[data-testid="register-password-input"]').type(user.password);
    cy.get('[data-testid="register-confirm-password-input"]').type(
      user.password,
    );
    cy.get('[data-testid="register-phone-input"]').type(user.phone);
    cy.get('[data-testid="register-submit-button"]').click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 201);

    // La app real no inicia sesión automáticamente tras registrarse (el
    // backend no devuelve token en /auth/register): redirige a /login y
    // pide iniciar sesión, mostrando un mensaje de éxito.
    cy.location("pathname").should("eq", "/login");
    cy.contains("Cuenta creada exitosamente").should("be.visible");
    cy.get('[data-testid="login-email-input"]').should(
      "have.value",
      user.email,
    );
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.null;
    });
  });

  it("muestra un error comprensible al registrar un correo ya existente y no se queda cargando", () => {
    cy.registerByApi().then((existingUser) => {
      cy.get('[data-testid="register-name-input"]').type("Otro Nombre");
      cy.get('[data-testid="register-email-input"]').type(existingUser.email);
      cy.get('[data-testid="register-password-input"]').type("Test1234!");
      cy.get('[data-testid="register-confirm-password-input"]').type(
        "Test1234!",
      );
      cy.get('[data-testid="register-submit-button"]').click();

      cy.wait("@registerRequest").its("response.statusCode").should("eq", 400);
      cy.get('[data-testid="register-email-error"]').should(
        "contain",
        "Este email ya está registrado",
      );
      cy.get('[data-testid="register-submit-button"]')
        .should("not.be.disabled")
        .and("contain", "Crear cuenta");
    });
  });
});
