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
  category: "",
};

function normalizeSizes(sizes) {
  if (!sizes || sizes.length === 0) return emptySizes;
  return SIZES.map((size) => {
    const found = sizes.find((s) => s.size === size);
    return { size, stock: found ? found.stock : 0 };
  });
}

const NEW_CATEGORY_OPTION = "__new__";

export default function ProductForm({
  onSubmit,
  onCancel,
  categories = [],
  onCreateCategory,
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
  // Categoría principal y subcategoría (opcional) se manejan como selects
  // separados en la UI, pero formData.category sigue siendo un solo campo:
  // guarda la subcategoría si se eligió, o la principal si no.
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  // Formularios inline para crear categoría/subcategoría sin salir de aquí.
  // null = oculto; objeto {name, description} = visible y en edición.
  const [newMainCategory, setNewMainCategory] = useState(null);
  const [newSubCategory, setNewSubCategory] = useState(null);
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  const mainCategories = categories.filter((c) => !c.parentCategory);
  const getSubcategories = (parentId) =>
    categories.filter((c) => c.parentCategory && c.parentCategory._id === parentId);

  useEffect(() => {
    setFormData({
      ...emptyProduct,
      ...initialValues,
      sizes: normalizeSizes(initialValues.sizes),
    });

    // Al editar, si la categoría guardada es una subcategoría, preseleccionamos
    // también su categoría principal para que ambos selects queden correctos.
    const currentId = initialValues.category || "";
    const currentCategory = categories.find((c) => c._id === currentId);

    if (currentCategory?.parentCategory) {
      setMainCategory(currentCategory.parentCategory._id);
      setSubCategory(currentCategory._id);
    } else {
      setMainCategory(currentId);
      setSubCategory("");
    }
  }, [initialValues, categories]);

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

  const handleMainCategoryChange = (e) => {
    const value = e.target.value;
    if (value === NEW_CATEGORY_OPTION) {
      setCategoryError(null);
      setNewMainCategory({ name: "", description: "" });
      return;
    }
    setMainCategory(value);
    setSubCategory("");
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    if (value === NEW_CATEGORY_OPTION) {
      setCategoryError(null);
      setNewSubCategory({ name: "", description: "" });
      return;
    }
    setSubCategory(value);
    setFormData((prev) => ({ ...prev, category: value || mainCategory }));
  };

  const handleCreateMainCategory = async () => {
    if (!newMainCategory.name.trim() || !newMainCategory.description.trim()) return;
    setCategoryCreating(true);
    setCategoryError(null);
    try {
      const created = await onCreateCategory({
        name: newMainCategory.name.trim(),
        description: newMainCategory.description.trim(),
      });
      setMainCategory(created._id);
      setSubCategory("");
      setFormData((prev) => ({ ...prev, category: created._id }));
      setNewMainCategory(null);
    } catch (error) {
      setCategoryError("No se pudo crear la categoría.");
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleCreateSubCategory = async () => {
    if (!newSubCategory.name.trim() || !newSubCategory.description.trim()) return;
    setCategoryCreating(true);
    setCategoryError(null);
    try {
      const created = await onCreateCategory({
        name: newSubCategory.name.trim(),
        description: newSubCategory.description.trim(),
        parentCategory: mainCategory,
      });
      setSubCategory(created._id);
      setFormData((prev) => ({ ...prev, category: created._id }));
      setNewSubCategory(null);
    } catch (error) {
      setCategoryError("No se pudo crear la subcategoría.");
    } finally {
      setCategoryCreating(false);
    }
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

      <div className="input-group">
        <label htmlFor="mainCategory" className="input-label">
          Categoría
        </label>
        <select
          id="mainCategory"
          name="mainCategory"
          className="input-field"
          value={mainCategory}
          onChange={handleMainCategoryChange}
          required={!newMainCategory}
        >
          <option value="">Selecciona una categoría</option>
          {mainCategories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
          <option value={NEW_CATEGORY_OPTION}>+ Nueva categoría</option>
        </select>
      </div>

      {newMainCategory && (
        <div className="input-group inline-category-form">
          <Input
            label="Nombre de la nueva categoría"
            value={newMainCategory.name}
            onChange={(e) =>
              setNewMainCategory((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            label="Descripción"
            value={newMainCategory.description}
            onChange={(e) =>
              setNewMainCategory((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          {categoryError && <span className="field-error">{categoryError}</span>}
          <div className="form-actions">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateMainCategory}
              disabled={categoryCreating}
            >
              {categoryCreating ? "Creando..." : "Crear categoría"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setNewMainCategory(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Subcategoría opcional: se muestra siempre que haya categoría principal,
          para poder crear la primera subcategoría aunque todavía no tenga ninguna */}
      {mainCategory && (
        <div className="input-group">
          <label htmlFor="subCategory" className="input-label">
            Subcategoría (opcional)
          </label>
          <select
            id="subCategory"
            name="subCategory"
            className="input-field"
            value={subCategory}
            onChange={handleSubCategoryChange}
          >
            <option value="">Sin subcategoría</option>
            {getSubcategories(mainCategory).map((subcat) => (
              <option key={subcat._id} value={subcat._id}>
                {subcat.name}
              </option>
            ))}
            <option value={NEW_CATEGORY_OPTION}>+ Nueva subcategoría</option>
          </select>
        </div>
      )}

      {newSubCategory && (
        <div className="input-group inline-category-form">
          <Input
            label="Nombre de la nueva subcategoría"
            value={newSubCategory.name}
            onChange={(e) =>
              setNewSubCategory((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            label="Descripción"
            value={newSubCategory.description}
            onChange={(e) =>
              setNewSubCategory((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          {categoryError && <span className="field-error">{categoryError}</span>}
          <div className="form-actions">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSubCategory}
              disabled={categoryCreating}
            >
              {categoryCreating ? "Creando..." : "Crear subcategoría"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setNewSubCategory(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
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
