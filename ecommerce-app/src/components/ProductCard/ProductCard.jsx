import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProductImageUrl } from "../../utils/images";
import Badge from "../common/Badge";
import Button from "../common/Button";
import "./ProductCard.css";

export default function ProductCard({ product, orientation = "vertical" }) {
  const { addItem: addToCart, items } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const { name, price, stock, imageURL, description, sizes } = product || {};

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

  const hasSizes = Boolean(sizes?.length);
  const selectedSizeStock = hasSizes
    ? sizes.find((s) => s.size === selectedSize)?.stock ?? 0
    : 0;
    const cartQuantity = items.find((item) => item.product._id === product._id &&
      item.size === (hasSizes ? selectedSize : null),
    )?.quantity ?? 0;
  const remainingStock = (hasSizes ? selectedSizeStock : stock) - cartQuantity;
  const addDisabled = hasSizes
    ? !selectedSize || remainingStock <= 0
    : stock === 0;

  const stockBadge =
    stock > 0
      ? { text: "Disponible", variant: "success" }
      : { text: "Agotado", variant: "error" };
  const hasDiscount = product.discount && product.discount > 0;

  const handleAddToCart = () => {
    if (remainingStock <= 0) return;
    if (hasSizes) {
      if (!selectedSize) return;
      addToCart(product, 1, selectedSize);
      return;
    }
    addToCart(product, 1);
  };

  const productLink = `/product/${product._id}`;
  const cardClass = `product-card product-card--${orientation}`;

  return (
    <div className={cardClass} data-testid={`product-card-${product._id}`}>
      <Link to={productLink} className="product-card-image-link">
        <img
          src={getProductImageUrl(imageURL)}
          alt={name}
          className="product-card-image"
          width="300"
          height="300"
          loading="lazy"
          decoding="async"
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
        {hasSizes && (
          <div
            className="product-card-sizes"
            data-testid={`size-selector-${product._id}`}
          >
            {sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                className={`size-option-sm${selectedSize === s.size ? " selected" : ""}`}
                disabled={s.stock === 0}
                onClick={() => setSelectedSize(s.size)}
                data-testid={`size-option-${product._id}-${s.size}`}
              >
                {s.size}
              </button>
            ))}
          </div>
        )}
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
          disabled={addDisabled}
          onClick={handleAddToCart}
          data-testid={`add-to-cart-button-${product._id}`}
        >
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
}
