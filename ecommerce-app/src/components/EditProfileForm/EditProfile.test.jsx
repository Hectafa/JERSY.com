import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditProfile from "./EditProfile";
import ProtectedRoute from "../../pages/ProtectedRoute";
import { AuthProvider } from "../../context/AuthContext";
import { getUserProfile, updateUserAvatar } from "../../services/userService";

jest.mock("../../services/userService");

function buildFakeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }),
  );
  return `${header}.${body}.fake-signature`;
}

function seedAuthenticatedUser(overrides = {}) {
  localStorage.setItem(
    "authToken",
    buildFakeToken({
      userId: "user-1",
      name: "Ada Lovelace",
      role: "customer",
      ...overrides,
    }),
  );
}

function renderEditProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile/edit"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute redirectTo="/login" allowedRoles={["admin", "customer", "cliente"]}>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<div>Página de perfil</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const pngFile = (name = "photo.png", size = 1024) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });

describe("EditProfile - foto de perfil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    seedAuthenticatedUser();
    getUserProfile.mockResolvedValue({
      name: "Ada Lovelace",
      email: "ada@example.com",
      avatar: null,
    });

    // jsdom no implementa object URLs.
    global.URL.createObjectURL = jest.fn(() => "blob:mock-preview");
    global.URL.revokeObjectURL = jest.fn();
  });

  test("muestra el placeholder cuando el usuario no tiene avatar", async () => {
    renderEditProfile();

    const avatar = await screen.findByAltText("Foto de perfil");
    expect(avatar).toHaveAttribute("src", "/img/user-placeholder.png");
  });

  test("resuelve el avatar existente contra el origen de la API", async () => {
    getUserProfile.mockResolvedValue({
      name: "Ada Lovelace",
      email: "ada@example.com",
      avatar: "/uploads/avatars/user-1-123.png",
    });

    renderEditProfile();

    const avatar = await screen.findByAltText("Foto de perfil");
    expect(avatar).toHaveAttribute(
      "src",
      "http://localhost:4000/uploads/avatars/user-1-123.png",
    );
  });

  test("al elegir una imagen válida muestra la vista previa y el botón Guardar foto", async () => {
    renderEditProfile();
    await screen.findByAltText("Foto de perfil");

    const input = screen.getByTestId("edit-profile-avatar-input");
    userEvent.upload(input, pngFile());

    expect(await screen.findByTestId("edit-profile-avatar-save")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByAltText("Foto de perfil")).toHaveAttribute(
        "src",
        "blob:mock-preview",
      ),
    );
    expect(updateUserAvatar).not.toHaveBeenCalled();
  });

  test("rechaza un archivo que no es imagen permitida y no ofrece guardar", async () => {
    renderEditProfile();
    await screen.findByAltText("Foto de perfil");

    const input = screen.getByTestId("edit-profile-avatar-input");
    const badFile = new File(["hola"], "documento.pdf", { type: "application/pdf" });
    userEvent.upload(input, badFile);

    expect(
      await screen.findByTestId("edit-profile-avatar-error"),
    ).toHaveTextContent("La imagen debe ser JPG, PNG o WEBP");
    expect(screen.queryByTestId("edit-profile-avatar-save")).not.toBeInTheDocument();
  });

  test("rechaza una imagen de más de 2MB", async () => {
    renderEditProfile();
    await screen.findByAltText("Foto de perfil");

    const input = screen.getByTestId("edit-profile-avatar-input");
    const bigFile = pngFile("grande.png", 2 * 1024 * 1024 + 1);
    userEvent.upload(input, bigFile);

    expect(
      await screen.findByTestId("edit-profile-avatar-error"),
    ).toHaveTextContent("La imagen no debe pesar más de 2MB");
    expect(screen.queryByTestId("edit-profile-avatar-save")).not.toBeInTheDocument();
  });

  test("al guardar sube la foto y refresca la vista previa con la respuesta del backend", async () => {
    updateUserAvatar.mockResolvedValue({
      avatar: "/uploads/avatars/user-1-456.png",
    });

    renderEditProfile();
    await screen.findByAltText("Foto de perfil");

    const input = screen.getByTestId("edit-profile-avatar-input");
    const file = pngFile();
    userEvent.upload(input, file);

    const saveButton = await screen.findByTestId("edit-profile-avatar-save");
    userEvent.click(saveButton);

    await waitFor(() =>
      expect(updateUserAvatar).toHaveBeenCalledWith("user-1", file),
    );

    await waitFor(() =>
      expect(screen.getByAltText("Foto de perfil")).toHaveAttribute(
        "src",
        "http://localhost:4000/uploads/avatars/user-1-456.png",
      ),
    );
    expect(screen.queryByTestId("edit-profile-avatar-save")).not.toBeInTheDocument();
  });

  test("muestra un error y conserva el botón Guardar foto si la subida falla", async () => {
    updateUserAvatar.mockRejectedValue(new Error("network down"));

    renderEditProfile();
    await screen.findByAltText("Foto de perfil");

    const input = screen.getByTestId("edit-profile-avatar-input");
    userEvent.upload(input, pngFile());
    userEvent.click(await screen.findByTestId("edit-profile-avatar-save"));

    expect(
      await screen.findByTestId("edit-profile-avatar-error"),
    ).toHaveTextContent("No se pudo subir la foto. Intenta de nuevo.");
    expect(screen.getByTestId("edit-profile-avatar-save")).toBeInTheDocument();
  });
});
