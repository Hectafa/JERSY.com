import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Badge from "../common/Badge";
import Button from "../common/Button";
import "./ProductCard.css";

export default function ProductCard({ product, orientation = "vertical" }) {
  const { addItem: addToCart } = useCart();
  const { name, price, stock, imagesUrl, description } = product || {};

  if (!product) {
    return (
      <div
        className="product-card"
        style={{ padding: "24px", textAlign: "center" }}
      >
        <p className="muted">Producto no disponible</p>
      </div>
    );
  }

  const stockBadge =
    stock > 0
      ? { text: "En stock", variant: "success" }
      : { text: "Agotado", variant: "error" };
  const hasDiscount = product.discount && product.discount > 0;
  const handleAddToCart = () => addToCart(product, 1);
  const productLink = `/product/${product._id}`;
  const cardClass = `product-card product-card--${orientation}`;

  return (
    <div className={cardClass} data-testid={`product-card-${product._id}`}>
      <Link to={productLink} className="product-card-image-link">
        <img
          src={imagesUrl ? imagesUrl[0] : "/img/products/placeholder.svg"}
          alt={name}
          className="product-card-image"
          onError={(event) => {
            event.target.src = "/img/products/placeholder.svg";
          }}
        />
      </Link>
      <div className="product-card-content">
        <h3 className="product-card-title">
          <Link
            to={productLink}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {name}
          </Link>
        </h3>
        {description && (
          <p
            className="muted"
            style={{ fontSize: "13px", marginBottom: "8px" }}
          >
            {description.length > 60
              ? `${description.substring(0, 60)}...`
              : description}
          </p>
        )}
        <div className="product-card-price">${price}</div>
      </div>
      <div className="product-card-actions">
        <div style={{ display: "flex", gap: "8px" }}>
          <Badge text={stockBadge.text} variant={stockBadge.variant} />
          {hasDiscount && (
            <Badge text={`-${product.discount}%`} variant="warning" />
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={stock === 0}
          onClick={handleAddToCart}
          data-testid={`add-to-cart-button-${product._id}`}
        >
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
}
