import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import Layout from "../../layout/Layout";
import Home from "../../pages/Home";
import Login from "../../pages/Login";
import ProtectedRoute from "../../pages/ProtectedRoute";
import Register from "../../pages/Register";
import { AuthProvider } from "../../context/AuthContext";
import Loading from "../common/Loading/Loading";

// Rutas fuera del camino crítico (no son "/"): se descargan bajo demanda
// para reducir el bundle inicial. Home/Login/Register/ProtectedRoute se
// mantienen eager porque son la entrada más común o wrappers triviales.
const AdminProducts = lazy(() => import("../../pages/AdminProducts"));
const AdminOrders = lazy(() => import("../../pages/AdminOrders"));
const AdminUsers = lazy(() => import("../../pages/AdminUsers"));
const Cart = lazy(() => import("../../pages/Cart"));
const CategoryPage = lazy(() => import("../../pages/CategoryPage"));
const ChangePassword = lazy(() => import("../ChangePassword/ChangePassword"));
const Checkout = lazy(() => import("../../pages/Checkout"));
const EditProfile = lazy(() => import("../EditProfileForm/EditProfile"));
const OrderConfirmation = lazy(() => import("../../pages/OrderConfirmation"));
const Orders = lazy(() => import("../../pages/Orders"));
const Product = lazy(() => import("../../pages/Product"));
const Profile = lazy(() => import("../../pages/Profile"));
const SearchResults = lazy(() => import("../../pages/SearchResults"));
const WishList = lazy(() => import("../../pages/WishList"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Suspense fallback={<Loading>Cargando...</Loading>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/product/:productId" element={<Product />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    redirectTo="/login"
                    allowedRoles={["admin", "customer", "cliente"]}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute
                    redirectTo="/login"
                    allowedRoles={["admin", "customer", "cliente"]}
                  >
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/change-password"
                element={
                  <ProtectedRoute
                    redirectTo="/login"
                    allowedRoles={["admin", "customer", "cliente"]}
                  >
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout></Checkout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishList></WishList>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-confirmation"
                element={<OrderConfirmation />}
              />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute redirectTo="/login" allowedRoles={["admin"]}>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute redirectTo="/login" allowedRoles={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute redirectTo="/login" allowedRoles={["admin"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<div>Ruta no encontrada</div>} />
            </Routes>
            </Suspense>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;