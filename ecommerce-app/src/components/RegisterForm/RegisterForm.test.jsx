import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RegisterForm from "./RegisterForm";
import { register } from "../../services/authService";

jest.mock("../../services/authService");

function renderRegisterForm() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillValidForm() {
  userEvent.type(screen.getByTestId("register-name-input"), "Juan Pérez");
  userEvent.type(screen.getByTestId("register-email-input"), "juan@test.com");
  userEvent.type(screen.getByTestId("register-password-input"), "secret123");
  userEvent.type(
    screen.getByTestId("register-confirm-password-input"),
    "secret123",
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza nombre, correo, contraseña, confirmación, botón y enlace a login", () => {
    renderRegisterForm();

    expect(screen.getByTestId("register-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-password-input")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-confirm-password-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("register-submit-button"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("register-login-link")).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("muestra errores de validación al enviar el formulario vacío y no llama al backend", async () => {
    renderRegisterForm();

    userEvent.click(screen.getByTestId("register-submit-button"));

    expect(
      await screen.findByTestId("register-name-error"),
    ).toHaveTextContent("El nombre es requerido");
    expect(screen.getByTestId("register-email-error")).toHaveTextContent(
      "El email es requerido",
    );
    expect(screen.getByTestId("register-password-error")).toHaveTextContent(
      "El password es requerido",
    );
    expect(register).not.toHaveBeenCalled();
  });

  test("muestra error de formato de correo inválido y no envía el formulario", async () => {
    renderRegisterForm();

    userEvent.type(screen.getByTestId("register-name-input"), "Juan Pérez");
    userEvent.type(screen.getByTestId("register-email-input"), "correo-invalido");
    userEvent.type(screen.getByTestId("register-password-input"), "secret123");
    userEvent.type(
      screen.getByTestId("register-confirm-password-input"),
      "secret123",
    );
    userEvent.click(screen.getByTestId("register-submit-button"));

    expect(
      await screen.findByTestId("register-email-error"),
    ).toHaveTextContent("El email no tiene un formato válido");
    expect(register).not.toHaveBeenCalled();
  });

  test("muestra error cuando las contraseñas no coinciden y no envía el formulario", async () => {
    renderRegisterForm();

    userEvent.type(screen.getByTestId("register-name-input"), "Juan Pérez");
    userEvent.type(screen.getByTestId("register-email-input"), "juan@test.com");
    userEvent.type(screen.getByTestId("register-password-input"), "secret123");
    userEvent.type(
      screen.getByTestId("register-confirm-password-input"),
      "otraClave1",
    );
    userEvent.click(screen.getByTestId("register-submit-button"));

    expect(
      await screen.findByTestId("register-confirm-password-error"),
    ).toHaveTextContent("Las contraseñas no coinciden");
    expect(register).not.toHaveBeenCalled();
  });

  test("registra exitosamente y navega a /login con el email prellenado", async () => {
    register.mockResolvedValue({
      name: "Juan Pérez",
      email: "juan@test.com",
      phone: undefined,
    });

    renderRegisterForm();
    fillValidForm();
    userEvent.click(screen.getByTestId("register-submit-button"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Juan Pérez",
        email: "juan@test.com",
        password: "secret123",
        phone: undefined,
      });
    });

    expect(await screen.findByText("Página de login")).toBeInTheDocument();
  });

  test("muestra estado de carga mientras se crea la cuenta", async () => {
    let resolveRegister;
    register.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );

    renderRegisterForm();
    fillValidForm();
    userEvent.click(screen.getByTestId("register-submit-button"));

    await waitFor(() =>
      expect(screen.getByTestId("register-submit-button")).toHaveTextContent(
        "Creando cuenta...",
      ),
    );
    expect(screen.getByTestId("register-submit-button")).toBeDisabled();

    resolveRegister({ name: "Juan Pérez", email: "juan@test.com" });

    await waitFor(() =>
      expect(screen.getByTestId("register-submit-button")).not.toBeDisabled(),
    );
  });

  test("muestra un error de campo cuando el correo ya está registrado", async () => {
    register.mockRejectedValue({
      kind: "CLIENT_ERROR",
      status: 400,
      original: { response: { data: { message: "User already exist" } } },
    });

    renderRegisterForm();
    fillValidForm();
    userEvent.click(screen.getByTestId("register-submit-button"));

    expect(
      await screen.findByTestId("register-email-error"),
    ).toHaveTextContent("Este email ya está registrado");
  });

  test("muestra un mensaje de error del servidor sin quedarse en estado de carga infinito", async () => {
    register.mockRejectedValue({ kind: "SERVER_ERROR", status: 500 });

    renderRegisterForm();
    fillValidForm();
    userEvent.click(screen.getByTestId("register-submit-button"));

    expect(await screen.findByTestId("form-error-server")).toBeInTheDocument();
    expect(screen.getByTestId("register-submit-button")).not.toBeDisabled();
  });
});
