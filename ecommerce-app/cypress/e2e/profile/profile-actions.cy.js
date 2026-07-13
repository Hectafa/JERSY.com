import { buildUniqueUser } from "../../utils/testData";

describe("Acciones de ProfileCard (verificación manual del punto 3 de pendientes-api.md)", () => {
  it("Editar Perfil: precarga name/email reales, guarda y refleja el nuevo nombre en /profile", () => {
    cy.registerByApi().then((user) => {
      cy.loginByApi({ email: user.email, password: user.password });

      cy.visit("/profile");
      cy.contains("Editar Perfil").click();

      cy.location("pathname").should("eq", "/profile/edit");
      cy.get('[data-testid="edit-profile-name-input"]').should("have.value", user.name);
      cy.get('[data-testid="edit-profile-email-input"]').should("have.value", user.email);

      cy.get('[data-testid="edit-profile-name-input"]').clear().type("Nombre Editado E2E");
      cy.get('[data-testid="edit-profile-submit-button"]').click();

      cy.location("pathname").should("eq", "/profile");
      cy.contains("Nombre Editado E2E").should("be.visible");
    });
  });

  it("Cambiar contraseña: rechaza con error de campo si currentPassword es incorrecta", () => {
    cy.registerByApi().then((user) => {
      cy.loginByApi({ email: user.email, password: user.password });

      cy.visit("/profile");
      cy.contains("Cambiar contraseña").click();
      cy.location("pathname").should("eq", "/profile/change-password");

      cy.get('[data-testid="change-password-current-input"]').type("ClaveIncorrecta1");
      cy.get('[data-testid="change-password-new-input"]').type("NuevaClave123!");
      cy.get('[data-testid="change-password-confirm-input"]').type("NuevaClave123!");
      cy.get('[data-testid="change-password-submit-button"]').click();

      cy.get('[data-testid="change-password-current-error"]').should(
        "contain",
        "incorrecta",
      );
      cy.location("pathname").should("eq", "/profile/change-password");
    });
  });

  it("Cambiar contraseña: con currentPassword correcta, cambia la contraseña y permite loguear con la nueva", () => {
    cy.registerByApi().then((user) => {
      cy.loginByApi({ email: user.email, password: user.password });

      cy.visit("/profile");
      cy.contains("Cambiar contraseña").click();

      cy.get('[data-testid="change-password-current-input"]').type(user.password);
      cy.get('[data-testid="change-password-new-input"]').type("NuevaClave123!");
      cy.get('[data-testid="change-password-confirm-input"]').type("NuevaClave123!");
      cy.get('[data-testid="change-password-submit-button"]').click();

      cy.location("pathname").should("eq", "/profile");

      cy.clearAllLocalStorage();
      cy.visit("/login");
      cy.get('[data-testid="login-email-input"]').type(user.email);
      cy.get('[data-testid="login-password-input"]').type("NuevaClave123!");
      cy.get('[data-testid="login-submit-button"]').click();

      cy.location("pathname").should("eq", "/");
      cy.contains(`Hola, ${user.name}`).should("be.visible");
    });
  });

  it('"Ver mis pedidos" navega a /orders', () => {
    cy.registerByApi().then((user) => {
      cy.loginByApi({ email: user.email, password: user.password });

      cy.visit("/profile");
      cy.contains("Ver mis pedidos").click();

      cy.location("pathname").should("eq", "/orders");
      cy.contains("Acceso denegado").should("not.exist");
    });
  });

  it("un customer no puede editar el perfil de otro usuario vía API (403)", () => {
    cy.registerByApi().then((victim) => {
      cy.registerByApi().then((attacker) => {
        cy.loginByApi({ email: attacker.email, password: attacker.password }).then(() => {
          cy.window().then((win) => {
            const token = win.localStorage.getItem("authToken");

            cy.request({
              method: "POST",
              url: `${Cypress.env("apiUrl")}/auth/login`,
              body: { email: victim.email, password: victim.password },
            }).then(({ body: victimLogin }) => {
              const victimPayload = JSON.parse(atob(victimLogin.token.split(".")[1]));

              cy.request({
                method: "PUT",
                url: `${Cypress.env("apiUrl")}/users/${victimPayload.userId}`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name: "Hackeado" },
                failOnStatusCode: false,
              }).then((res) => {
                expect(res.status).to.eq(403);
              });
            });
          });
        });
      });
    });
  });
});
