import { useCart } from "../../context/CartContext";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";

export default function CartView() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  return (
    <div className="cart-view">
      <div className="cart-view-header">
        <h2>
          {cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      {cartItems &&
        cartItems.map((item) => (
          <div className="cart-item" key={item._id}>
            <div className="cart-item-image">
              <img src={item.imagesUrl[0]} alt={item.name} loading="lazy" />
            </div>

            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p className="cart-item-price">{`$${item.price.toFixed(2)}`}</p>
            </div>

            <div className="cart-item-quantity">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateQuantity(item._id, item.quantity - 1)}
              >
                <Icon name="minus" size={15}></Icon>
              </Button>
              <span>{item.quantity}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateQuantity(item._id, item.quantity + 1)}
              >
                <Icon name="plus" size={15}></Icon>
              </Button>
            </div>

            <div className="cart-item-total">
              ${(item.price * item.quantity).toFixed(2)}
            </div>

            <Button
              variant="ghost"
              className="danger"
              size="sm"
              onClick={() => removeFromCart(item._id)}
              title="Eliminar artículo"
            >
              <Icon name="trash" size={16} />
            </Button>
          </div>
        ))}
    </div>
  );
}