import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import { getProductById } from "../../services/productsService";
import { addProductToWishlist } from "../../services/wishlistService";
import Badge from "../common/Badge";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Icon from "../common/Icon/Icon";
import "./ProductDetails.css";

export default function ProductDetails({ productId }) {
  const { addItem: addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistStatus, setWishlistStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(productId);
        if (!cancelled) return setProduct(data);
      } catch (error) {
        if (cancelled) return;
        setError(error.kind || "UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (product) addToCart(product, 1);
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    try {
      setWishlistStatus("saving");
      await addProductToWishlist(user.id, product._id);
      setWishlistStatus("saved");
    } catch (err) {
      setWishlistStatus("error");
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error === "NOT_FOUND") {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <h2>Producto no encontrado</h2>
          <p className="muted">
            Este producto no existe o fue retirado del catálogo.
            <Link to="/">Volver al catálogo</Link>
          </p>
        </ErrorMessage>
      </div>
    );
  }

  if (error === "NETWORK" || error === "TIMEOUT") {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <h2>No pudimos conectar con el servidor.</h2>
          <p className="muted">
            Revisa tu conexión a internet.
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </p>
        </ErrorMessage>
      </div>
    );
  }

  if (error === "SERVER_ERROR") {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <h2>Algo salió mal de nuestro lado.</h2>
          <p className="muted">
            Estamos trabajando en ello. Intenta en unos minutos.
          </p>
        </ErrorMessage>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <p className="muted">Ocurrió un error inesperado.</p>
        </ErrorMessage>
      </div>
    );
  }

  if (!product) return null;

  const { name, description, price, stock, imageURL, category } = product;
  const stockBadge = stock > 0 ? "success" : "error";
  const stockLabel = stock > 0 ? "En stock" : "Agotado";

  return (
    <div className="product-details-container" data-testid="product-detail">
      <Breadcrumb
        items={[
          { label: "Inicio", to: "/" },
          category
            ? { label: category.name, to: `/category/${category.id}` }
            : { label: "Sin categoría" },
          { label: name },
        ]}
      />
      <div className="product-details-main">
        <div className="product-details-image">
          <img
            src={imageURL || "/img/products/placeholder.svg"}
            alt={name}
            width="600"
            height="600"
            fetchpriority="high"
            decoding="async"
            onError={(event) => {
              event.target.src = "/img/products/placeholder.svg";
            }}
          />
        </div>
        <div className="product-details-info">
          <div className="product-details-title">
            <h1 className="h1">{name}</h1>
            {category?.name && (
              <span className="product-details-category">{category?.name}</span>
            )}
          </div>
          <p className="product-details-description">{description}</p>
          <div className="product-details-stock">
            <Badge text={stockLabel} variant={stockBadge} />
            {stock > 0 && (
              <span className="muted">{stock} unidades disponibles</span>
            )}
          </div>
          <div className="product-details-price">${price}</div>
          <div className="product-details-actions">
            <Button
              variant="primary"
              size="lg"
              disabled={stock === 0}
              onClick={handleAddToCart}
              data-testid="add-to-cart-button"
            >
              Agregar al carrito
            </Button>
            <Link
              to="/cart"
              className="btn btn-outline btn-lg"
              data-testid="go-to-cart-link"
            >
              Ver carrito
            </Link>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="lg"
                disabled={wishlistStatus === "saving" || wishlistStatus === "saved"}
                onClick={handleAddToWishlist}
                data-testid="add-to-wishlist-button"
              >
                <Icon name="heart" size={18} />
                {wishlistStatus === "saved"
                  ? "Agregado a la lista"
                  : "Agregar a lista de deseos"}
              </Button>
            )}
          </div>
          {wishlistStatus === "error" && (
            <ErrorMessage>No se pudo agregar el producto a tu lista de deseos.</ErrorMessage>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-2x1 mx-auto p-6 animate-pulse">
      <div className="bg-gray-200 h-80 mb-4 rounded"></div>
      <div className="bg-gray-200 h-8 w-3/4 mb-2 rounded"></div>
      <div className="bg-gray-200 h-6 w-1/4 rounded"></div>
    </div>
  );
}
