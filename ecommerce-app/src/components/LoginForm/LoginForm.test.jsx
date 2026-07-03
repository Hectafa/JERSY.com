import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./LoginForm";
import { AuthProvider } from "../../context/AuthContext";
import * as authService from "../../services/authService";

jest.mock("../../services/authService");

function renderLoginForm({ initialEntries = ["/login"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<div>Página de inicio</div>} />
          <Route path="/register" element={<div>Página de registro</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renderiza los campos de email, contraseña, botón de login y enlace a registro", () => {
    renderLoginForm();

    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-button")).toBeInTheDocument();
    expect(screen.getByTestId("login-register-link")).toHaveAttribute(
      "href",
      "/register",
    );
  });

  test("los campos de email y contraseña son requeridos", () => {
    renderLoginForm();

    expect(screen.getByTestId("login-email-input")).toBeRequired();
    expect(screen.getByTestId("login-password-input")).toBeRequired();
  });

  test("el campo de email tiene type=email para validar formato", () => {
    renderLoginForm();
    expect(screen.getByTestId("login-email-input")).toHaveAttribute(
      "type",
      "email",
    );
  });

  test("envía el formulario y navega al iniciar sesión correctamente", async () => {
    authService.login.mockResolvedValue({
      token: buildFakeToken({ userId: "u1", name: "Ana", role: "customer" }),
      refreshToken: "refresh-token",
    });

    renderLoginForm();

    userEvent.type(screen.getByTestId("login-email-input"), "ana@test.com");
    userEvent.type(screen.getByTestId("login-password-input"), "secret123");
    userEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: "ana@test.com",
        password: "secret123",
      });
    });

    expect(await screen.findByText("Página de inicio")).toBeInTheDocument();
  });

  test("muestra estado de carga mientras se procesa el login", async () => {
    let resolveLogin;
    authService.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );

    renderLoginForm();

    userEvent.type(screen.getByTestId("login-email-input"), "ana@test.com");
    userEvent.type(screen.getByTestId("login-password-input"), "secret123");
    userEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() =>
      expect(screen.getByTestId("login-submit-button")).toHaveTextContent(
        "Iniciando sesión...",
      ),
    );
    expect(screen.getByTestId("login-submit-button")).toBeDisabled();

    resolveLogin({
      token: buildFakeToken({ userId: "u1", name: "Ana", role: "customer" }),
      refreshToken: "refresh-token",
    });

    await waitFor(() =>
      expect(screen.getByTestId("login-submit-button")).not.toBeDisabled(),
    );
  });

  test("muestra un mensaje de error cuando las credenciales son incorrectas", async () => {
    authService.login.mockRejectedValue({
      kind: "CLIENT_ERROR",
      status: 400,
      original: { response: { data: { message: "Invalid Credentials" } } },
    });

    renderLoginForm();

    userEvent.type(screen.getByTestId("login-email-input"), "ana@test.com");
    userEvent.type(screen.getByTestId("login-password-input"), "wrongpass");
    userEvent.click(screen.getByTestId("login-submit-button"));

    expect(
      await screen.findByTestId("login-error-message"),
    ).toHaveTextContent("Email o contraseña incorrectos.");
    expect(screen.getByTestId("login-submit-button")).not.toBeDisabled();
  });

  test("muestra un mensaje distinto cuando el usuario no existe", async () => {
    authService.login.mockRejectedValue({
      kind: "CLIENT_ERROR",
      status: 400,
      original: {
        response: {
          data: { message: "User does not exist. You must sign in." },
        },
      },
    });

    renderLoginForm();

    userEvent.type(screen.getByTestId("login-email-input"), "nadie@test.com");
    userEvent.type(screen.getByTestId("login-password-input"), "secret123");
    userEvent.click(screen.getByTestId("login-submit-button"));

    expect(
      await screen.findByTestId("login-error-message"),
    ).toHaveTextContent(/no registrado/i);
  });

  test("guarda el token en localStorage al iniciar sesión exitosamente", async () => {
    authService.login.mockResolvedValue({
      token: buildFakeToken({ userId: "u1", name: "Ana", role: "customer" }),
      refreshToken: "refresh-token",
    });

    renderLoginForm();

    userEvent.type(screen.getByTestId("login-email-input"), "ana@test.com");
    userEvent.type(screen.getByTestId("login-password-input"), "secret123");
    userEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(localStorage.getItem("authToken")).toBeTruthy();
    });
  });
});

function buildFakeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }),
  );
  return `${header}.${body}.fake-signature`;
}
