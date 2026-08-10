import { useEffect, useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { uploadProductImage } from "../../services/productsService";
import { getProductImageUrl } from "../../utils/images";

const SIZES = ["CH", "M", "G", "XL"];

const emptySizes = SIZES.map((size) => ({ size, stock: 0 }));

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  sizes: emptySizes,
  imageURL: "",
};

function normalizeSizes(sizes) {
  if (!sizes || sizes.length === 0) return emptySizes;
  return SIZES.map((size) => {
    const found = sizes.find((s) => s.size === size);
    return { size, stock: found ? found.stock : 0 };
  });
}

export default function ProductForm({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) {
  const [formData, setFormData] = useState({
    ...emptyProduct,
    ...initialValues,
    sizes: normalizeSizes(initialValues.sizes),
  });
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    setFormData({
      ...emptyProduct,
      ...initialValues,
      sizes: normalizeSizes(initialValues.sizes),
    });
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeStockChange = (size, value) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s) => (s.size === size ? { ...s, stock: value } : s)),
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageError(null);
    setUploading(true);
    try {
      const { imageURL } = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageURL }));
    } catch (error) {
      setImageError("No se pudo subir la imagen. Intenta con otro archivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sizes = formData.sizes.map((s) => ({
      size: s.size,
      stock: parseInt(s.stock, 10) || 0,
    }));
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      stock: sizes.reduce((sum, s) => sum + s.stock, 0),
      sizes,
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

      <div className="input-group">
        <label className="input-label">Stock por talla</label>
        <div className="form-row">
          {formData.sizes.map((s) => (
            <Input
              key={s.size}
              label={s.size}
              name={`size-${s.size}`}
              type="number"
              min="0"
              value={s.stock}
              onChange={(e) => handleSizeStockChange(s.size, e.target.value)}
            />
          ))}
        </div>
      </div>

      <Input
        label="URL de la imagen"
        name="imageURL"
        value={formData.imageURL}
        onChange={handleChange}
        placeholder="https://...o sube un archivo abajo"
      />

      <div className="input-group">
        <label htmlFor="imageFile" className="input-label">
          subir imagen
        </label>
        <input
        id="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="input-field"
        onChange={handleImageFileChange}
        disabled={uploading}
        />
        {uploading && <span>Subiendo imagen...</span>}
        {imageError && <span className="field-error">{imageError}</span>}
      </div>

      {formData.imageURL && (
        <img
        src={getProductImageUrl(formData.imageURL)}
        alt="Vista previa"
        style={{ maxWidth: "160px", display: "block", marginBottom: "1rem" }}
        />
      )}

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
