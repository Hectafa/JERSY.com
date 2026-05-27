import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import Layout from "../../layout/Layout";
import Cart from "../../pages/Cart";
import CategoryPage from "../../pages/CategoryPage";
import Checkout from "../../pages/Checkout";
import Home from "../../pages/Home";
import Login from "../../pages/Login";
import OrderConfirmation from "../../pages/OrderConfirmation";
import Orders from "../../pages/Orders";
import Product from "../../pages/Product";
import Profile from "../../pages/Profile";
import ProtectedRoute from "../../pages/ProtectedRoute";
import SearchResults from "../../pages/SearchResults";
import Settings from "../../pages/Setttings";
import WishList from "../../pages/WishList";
import { AuthProvider } from "../../context/AuthContext";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
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
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings></Settings>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<div>Ruta no encontrada</div>} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
