import CartView from "../components/Cart/CartView";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export default function PurchaseOrder() {

  const addressList = [
    {
      name: "Home",
      address1: "Calle 1",
      address2: "Colonia 1",
      postalCode: "20000",
      city: "Aguascalientes",
      country: "México",
      reference: "Entre calle A y B",
      default: true,
    },
    {
      name: "Work",
      address1: "Calle 2",
      address2: "Colonia 2",
      postalCode: "20000",
      city: "Aguascalientes",
      country: "México",
      reference: "Entre calle A y B",
      default: false,
    },
  ];
  const paymentMethodList = [
    {
      alias: "Tarjeta1",
      cardNumber: "4444-4444-4444-4444",
      placeHolder: "Rodrigo",
      expireDate: "08/31",
      cvv: "123",
      default: true,
    },
    {
      alias: "Tarjeta2",
      cardNumber: "4444-4444-4444-4444",
      placeHolder: "Rodrigo",
      expireDate: "08/31",
      cvv: "123",
      default: false,
    },
  ];

  return (
    <div className="order-container">
      <div className="order-left">
        <div className="order-address">
          <p>
            {addressList.find((a) => a.default === true).name}
            {addressList.find((a) => a.default === true).address1}
          </p>
          <Button>Cambiar</Button>
          <div className="address-list">
            <ul>
              {addressList.map((addss) => {
                return (
                  <li>
                    <h3>{addss.name}</h3>
                    <p>{addss.address1}</p>
                    <p>{addss.address2}</p>
                    <p>{addss.postalCode}</p>
                    <p>{addss.city}</p>
                    <p>{addss.reference}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <form className="address-form">
            <Input label="name" type="text" />
            <Input label="address1" type="text" />
            <Input label="address2" type="text" />
            <Input label="postalCode" type="text" />
            <Input label="city" type="text" />
            <Input label="country" type="text" />
            <Input label="reference" type="text" />
            <label>Guardar como predeterminada: </label>
            <input type="check"></input>
            <Button>Guardar</Button>
          </form>
        </div>
        <div className="order-payment">
          <p>
            {paymentMethodList.find((p) => p.default === true).alias}
            {paymentMethodList.find((p) => p.default === true).placeHolder}
          </p>
          <Button>Cambiar</Button>
          <div className="payments-list">
            <ul>
              {paymentMethodList.map((payment) => {
                return (
                  <li>
                    <h3>{payment.alias}</h3>
                    <p>{payment.placeHolder}</p>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>
        <CartView />
      </div>
      <div className="order-right">
        <h3>Total: </h3>
        <p>Fecha de entrega: </p>
        <Button>Pagar</Button>
      </div>
    </div>
  );
}
