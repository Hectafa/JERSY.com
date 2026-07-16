import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard/ProductCard";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { useAuth } from "../context/AuthContext";
import {
  getWishlistByUser,
  removeProductFromWishlist,
} from "../services/wishlistService";

export default function WishList() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      try {
        setLoading(true);
        setError(null);
        const data = await getWishlistByUser(user.id);
        if (!cancelled) setWishlist(data);
      } catch (err) {
        if (!cancelled) setError("No se pudo cargar tu lista de deseos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleRemove = async (productId) => {
    try {
      const updated = await removeProductFromWishlist(wishlist._id, productId);
      setWishlist(updated);
    } catch (err) {
      setError("No se pudo quitar el producto de la lista de deseos.");
    }
  };

  if (loading) return <Loading>Cargando tu lista de deseos...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  const products = wishlist?.products || [];

  return (
    <div className="wishlist-container" style={{ padding: "24px" }}>
      <h1 className="h1">Lista de deseos</h1>
      {products.length === 0 ? (
        <p className="muted">Aún no has agregado productos a tu lista de deseos.</p>
      ) : (
        <div
          className="wishlist-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {products.map((product) => (
            <div key={product._id}>
              <ProductCard product={product} />
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: "8px", width: "100%" }}
                onClick={() => handleRemove(product._id)}
              >
                Quitar de la lista
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
