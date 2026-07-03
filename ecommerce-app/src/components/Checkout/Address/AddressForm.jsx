import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./AddressForm.css";

const AddressForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) => {
  const emptyForm = {
    name: "",
    address1: "",
    address2: "",
    state: "",
    phone: "",
    postalCode: "",
    city: "",
    country: "",
    reference: "",
    default: false,
  };

  const [formData, setFormData] = useState({
    ...emptyForm,
    ...initialValues,
  });

  // Actualizar formulario cuando initialValues cambia (modo edición)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        ...emptyForm,
        ...initialValues,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);

    // Resetear formulario solo si es nuevo (no edición)
    if (!isEdit) {
      setFormData(emptyForm);
    }
  };

  return (
    <form
      className="address-form"
      onSubmit={handleSubmit}
      data-testid="checkout-address-form"
    >
      <h3>{isEdit ? "Editar Dirección" : "Nueva Dirección"}</h3>

      <Input
        label="Nombre de la dirección"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        data-testid="checkout-address-name-input"
      />

      <Input
        label="Dirección Línea 1"
        name="address1"
        value={formData.address1}
        onChange={handleChange}
        required
        data-testid="checkout-address-line1-input"
      />

      <Input
        label="Dirección Línea 2"
        name="address2"
        value={formData.address2}
        onChange={handleChange}
        data-testid="checkout-address-line2-input"
      />

      <Input
        label="Ciudad"
        name="city"
        value={formData.city}
        onChange={handleChange}
        required
        data-testid="checkout-address-city-input"
      />

      <Input
        label="Estado"
        name="state"
        value={formData.state}
        onChange={handleChange}
        required
        data-testid="checkout-address-state-input"
      />

      <Input
        label="Código Postal"
        name="postalCode"
        value={formData.postalCode}
        onChange={handleChange}
        required
        pattern="[0-9]{5}"
        data-testid="checkout-address-postal-code-input"
      />

      <Input
        label="País"
        name="country"
        value={formData.country}
        onChange={handleChange}
        required
        data-testid="checkout-address-country-input"
      />

      <Input
        label="Teléfono"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        required
        data-testid="checkout-address-phone-input"
      />

      <Input
        label="Referencia"
        name="reference"
        value={formData.reference}
        onChange={handleChange}
        data-testid="checkout-address-reference-input"
      />

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="default"
          checked={formData.default}
          onChange={handleChange}
          id="defaultAddress"
        />
        <label htmlFor="defaultAddress">
          Establecer como dirección predeterminada
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit" data-testid="checkout-address-submit-button">
          {isEdit ? "Guardar Cambios" : "Agregar Dirección"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
