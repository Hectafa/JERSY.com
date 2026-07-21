import { useCart } from "../../context/CartContext";
import { getProductImageUrl } from "../../utils/images";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";

export default function CartView() {
  const { items, removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-view" data-testid="cart-view">
      <div className="cart-view-header">
        <h2>
          {items.length} {items.length === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      {items.map((item) => (
        <div
          className="cart-item"
          key={item.product._id}
          data-testid={`cart-item-${item.product._id}`}
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
            <p className="cart-item-price">{`$${item.product.price.toFixed(2)}`}</p>
          </div>

          <div className="cart-item-quantity">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                updateQuantity(item.product._id, item.quantity - 1)
              }
              data-testid={`cart-item-decrease-${item.product._id}`}
            >
              <Icon name="minus" size={15}></Icon>
            </Button>
            <span data-testid={`cart-item-quantity-${item.product._id}`}>
              {item.quantity}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                updateQuantity(item.product._id, item.quantity + 1)
              }
              data-testid={`cart-item-increase-${item.product._id}`}
            >
              <Icon name="plus" size={15}></Icon>
            </Button>
          </div>

          <div className="cart-item-total">
            ${(item.product.price * item.quantity).toFixed(2)}
          </div>

          <Button
            variant="ghost"
            className="danger"
            size="sm"
            onClick={() => removeItem(item.product._id)}
            title="Eliminar artículo"
            data-testid={`cart-item-remove-${item.product._id}`}
          >
            <Icon name="trash" size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}