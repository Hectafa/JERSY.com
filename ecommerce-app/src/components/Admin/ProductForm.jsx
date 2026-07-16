import { useEffect, useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  imageURL: "",
  category: "",
};

export default function ProductForm({
  onSubmit,
  onCancel,
  categories = [],
  initialValues = {},
  isEdit = false,
}) {
  const [formData, setFormData] = useState({ ...emptyProduct, ...initialValues });

  useEffect(() => {
    setFormData({ ...emptyProduct, ...initialValues });
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
    });
  };

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Editar producto" : "Nuevo producto"}</h3>

      <Input
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        label="Descripción"
        name="description"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <div className="form-row">
        <Input
          label="Precio"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <Input
          label="Stock"
          name="stock"
          type="number"
          min="0"
          value={formData.stock}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        label="URL de la imagen"
        name="imageURL"
        value={formData.imageURL}
        onChange={handleChange}
      />

      <div className="input-group">
        <label htmlFor="category" className="input-label">
          Categoría
        </label>
        <select
          id="category"
          name="category"
          className="input-field"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
