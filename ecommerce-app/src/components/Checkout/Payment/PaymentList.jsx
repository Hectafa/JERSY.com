import Button from "../../common/Button";
import PaymentItem from "./PaymentItem";
import "./PaymentList.css";

const PaymentList = ({
  payments,
  selectedPayment,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}) => {
  return (
    <div className="payment-list">
      <div className="payment-list-header">
        <h3>Métodos de Pago</h3>
        <Button onClick={onAdd}>Agregar Nueva Tarjeta</Button>
      </div>
      <div className="payment-list-content">
        {payments.map((payment) => (
          <PaymentItem
            key={payment._id || payment.alias}
            payment={payment}
            isSelected={selectedPayment?._id === payment._id}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentList;
