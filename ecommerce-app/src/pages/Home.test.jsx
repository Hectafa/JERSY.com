import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { getAllProducts } from "../services/productsService";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

jest.mock("../services/productsService");
jest.mock("../components/BannerCarousel", () => () => (
  <div data-testid="banner-carousel-stub" />
));

const buildProduct = (overrides = {}) => ({
  _id: "p1",
  name: "Laptop Gamer",
  price: 25999,
  stock: 5,
  description: "Una laptop muy rápida",
  ...overrides,
});

function renderHome() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Home />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Home (listado de productos)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("muestra el estado de carga mientras se obtienen los productos", () => {
    getAllProducts.mockReturnValue(new Promise(() => {}));

    renderHome();

    expect(screen.getByText(/Cargando productos/i)).toBeInTheDocument();
  });

  test("renderiza el listado de productos obtenidos de la API", async () => {
    getAllProducts.mockResolvedValue({
      products: [
        buildProduct({ _id: "p1", name: "Laptop Gamer" }),
        buildProduct({ _id: "p2", name: "Mouse Inalámbrico" }),
      ],
      pagination: { total: 2 },
    });

    renderHome();

    expect(await screen.findByTestId("product-card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("product-card-p2")).toBeInTheDocument();
    expect(screen.getByText("Laptop Gamer")).toBeInTheDocument();
    expect(screen.getByText("Mouse Inalámbrico")).toBeInTheDocument();
  });

  test("muestra un mensaje de catálogo vacío cuando no hay productos", async () => {
    getAllProducts.mockResolvedValue({ products: [], pagination: { total: 0 } });

    renderHome();

    expect(
      await screen.findByText("No hay productos en el catálogo."),
    ).toBeInTheDocument();
  });

  test("muestra un mensaje de error de red cuando la API no responde", async () => {
    getAllProducts.mockRejectedValue({ kind: "NETWORK" });

    renderHome();

    expect(
      await screen.findByText(/No pudimos conectar/i),
    ).toBeInTheDocument();
  });

  test("muestra un mensaje de error de servidor cuando la API falla", async () => {
    getAllProducts.mockRejectedValue({ kind: "SERVER_ERROR" });

    renderHome();

    expect(await screen.findByText(/Algo salió mal/i)).toBeInTheDocument();
  });

  test("cada tarjeta de producto enlaza a su página de detalle", async () => {
    getAllProducts.mockResolvedValue({
      products: [buildProduct({ _id: "p1", name: "Laptop Gamer" })],
      pagination: { total: 1 },
    });

    renderHome();

    const card = await screen.findByTestId("product-card-p1");
    const link = card.querySelector('a[href="/product/p1"]');
    expect(link).toBeInTheDocument();
  });

  test('el botón "Agregar al carrito" está deshabilitado quedando sin stock', async () => {
    getAllProducts.mockResolvedValue({
      products: [buildProduct({ _id: "p1", stock: 0 })],
      pagination: { total: 1 },
    });

    renderHome();

    const button = await screen.findByTestId("add-to-cart-button-p1");
    expect(button).toBeDisabled();
  });
});
