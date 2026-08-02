import { useCart, getItemKey } from "../../context/CartContext";
import { getProductImageUrl } from "../../utils/images";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";
import "./CartView.css";

export default function CartView() {
  const { items, count, removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-view" data-testid="cart-view">
      <div className="cart-view-header">
        <h2>
          {count} {count === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      {items.map((item) => {
        const itemKey = getItemKey(item);
        const sizeStock = item.size
          ? item.product.sizes?.find((s) => s.size === item.size)?.stock
          : undefined;
        const stock = sizeStock ?? item.product.stock;
        const hasStockLimit = typeof stock === "number";
        const atStockLimit = hasStockLimit && item.quantity >= stock;

        return (
        <div
          className="cart-item"
          key={itemKey}
          data-testid={`cart-item-${itemKey}`}
        >
          <div className="cart-item-image">
            <img
              src={getProductImageUrl(item.product.imageURL)}
              alt={item.product.name}
              loading="lazy"
            />
          </div>

          <div className="cart-item-info">
            <h3>{item.product.name}</h3>
            {item.size && <p className="muted">Talla: {item.size}</p>}
            <p className="cart-item-price">{`$${item.product.price.toFixed(2)}`}</p>
          </div>

        <div className="cart-item-quantity-wrapper">
          <div className="cart-item-quantity">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                updateQuantity(itemKey, item.quantity - 1)
              }
              data-testid={`cart-item-decrease-${itemKey}`}
            >
              <Icon name="minus" size={15}></Icon>
            </Button>
            <span data-testid={`cart-item-quantity-${itemKey}`}>
              {item.quantity}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={atStockLimit}
              onClick={() =>
                updateQuantity(itemKey, item.quantity + 1)
              }
              title={
                atStockLimit
                ? `Solo hay ${stock} unidades disponibles`
                : undefined
              }
              data-testid={`cart-item-increase-${itemKey}`}
            >
              <Icon name="plus" size={15}></Icon>
            </Button>
            </div>
            {atStockLimit && (
              <span
              className="cart-item-stock-warning"
              data-testid={`cart-item-stock-warning-${itemKey}`}>
                Alcanzaste el máximo disponible en stock ({stock})
              </span>
            )}
          </div>

          <div className="cart-item-total">
            ${(item.product.price * item.quantity).toFixed(2)}
          </div>

          <Button
            variant="ghost"
            className="danger"
            size="sm"
            onClick={() => removeItem(itemKey)}
            title="Eliminar artículo"
            data-testid={`cart-item-remove-${itemKey}`}
          >
            <Icon name="trash" size={16} />
          </Button>
        </div>
    );
  })}
    </div>
  );
}
