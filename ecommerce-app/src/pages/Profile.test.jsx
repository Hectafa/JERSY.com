import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Profile from "./Profile";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";

function buildFakeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `${header}.${body}.fake-signature`;
}

function seedAuthenticatedUser(overrides = {}) {
  localStorage.setItem(
    "authToken",
    buildFakeToken({ userId: "user-1", name: "Ada Lovelace", role: "customer", ...overrides }),
  );
}

// Réplica de la ruta real en App.jsx: /profile está protegida por ProtectedRoute
// con allowedRoles={["admin", "customer", "cliente"]}. Renderizar <Profile /> a
// secas rompería, porque ProfileCard hace `currentUser.role` sin verificar que
// currentUser exista; en producción ProtectedRoute nunca deja pasar sin usuario.
function renderProfileRoute() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute redirectTo="/login" allowedRoles={["admin", "customer", "cliente"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Profile (página)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("redirige a /login cuando no hay usuario autenticado", () => {
    renderProfileRoute();

    expect(screen.getByText("Página de login")).toBeInTheDocument();
  });

  test("muestra el nombre y el rol del usuario autenticado", async () => {
    seedAuthenticatedUser({ name: "Ada Lovelace", role: "customer" });

    renderProfileRoute();

    expect(await screen.findByText("customer")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
  });

  test("muestra 'No disponible' para el email porque el token no lo incluye", async () => {
    seedAuthenticatedUser();

    renderProfileRoute();

    await screen.findByText("customer");
    expect(screen.getAllByText("No disponible").length).toBeGreaterThan(0);
  });

  test("muestra acciones específicas de administrador cuando el rol es admin", async () => {
    seedAuthenticatedUser({ role: "admin" });

    renderProfileRoute();

    expect(await screen.findByText("Panel de administración")).toBeInTheDocument();
  });

  test("no muestra acciones de administrador para un rol customer", async () => {
    seedAuthenticatedUser({ role: "customer" });

    renderProfileRoute();

    await screen.findByText("customer");
    expect(screen.queryByText("Panel de administración")).not.toBeInTheDocument();
  });
});
