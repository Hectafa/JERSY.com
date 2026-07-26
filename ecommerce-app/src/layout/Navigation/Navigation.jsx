import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import ErrorMessage from "../../components/common/ErrorMessage/ErrorMessage";
import Loading from "../../components/common/Loading/Loading";
import { getAllCategories } from "../../services/categoryService";
import "./Navigation.css";

const Navigation = ({ isMobile = false, onLinkClick }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllCategories();
        if (cancelled) return;
        setCategories(data);
      } catch (err) {
        if (!cancelled) setError(err.kind || "UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Categorías principales = raíces (sin parentCategory)
  const mainCategories = categories.filter((cat) => !cat.parentCategory);

  // Función para obtener subcategorías de una categoría principal
  const getSubcategories = (parentId) => {
    const subcategories = categories.filter(
      (cat) => cat.parentCategory && cat.parentCategory._id === parentId
    );
    return subcategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Si es versión móvil, renderizar solo los enlaces principales
  if (isMobile) {
    return (
      <div className="mobile-navigation">
        {/* Categorías principales */}
        {loading && <Loading>Cargando categorías...</Loading>}
        {!loading && error && (
          <ErrorMessage>No pudimos cargar las categorías.</ErrorMessage>
        )}
        {!loading &&
          !error &&
          mainCategories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category._id}`}
              className="mobile-nav-link"
              onClick={onLinkClick}
            >
              <Icon name="chevronRight" size={16} />
              {category.name}
            </Link>
          ))}
      </div>
    );
  }

  return (
    <div className="navigation">
      <div className="container">
        <div className="navigation-content">
          {/* Menú de todas las categorías */}
          <div className="categories-dropdown" ref={dropdownRef}>
            <button
              className="categories-menu-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Icon name="menu" size={16} />
              <span>Todas las categorías</span>
              <Icon name="chevronDown" size={14} />
            </button>

            {isDropdownOpen && (
              <div className="categories-dropdown-menu">
                {loading && <Loading>Cargando categorías...</Loading>}
                {!loading && error && (
                  <ErrorMessage>
                    No pudimos cargar las categorías.
                  </ErrorMessage>
                )}
                {!loading &&
                  !error &&
                  mainCategories.map((category) => {
                    const subcategories = getSubcategories(category._id);
                    return (
                    <div key={category._id} className="category-group">
                      <Link
                        to={`/category/${category._id}`}
                        className="category-link main-category"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {category.name}
                        {subcategories.length > 0 && (
                          <Icon name="chevronRight" size={12} />
                        )}
                      </Link>

                      {subcategories.length > 0 && (
                        <div className="subcategories">
                          {subcategories.map((subcat) => (
                            <Link
                              key={subcat._id}
                              to={`/category/${subcat._id}`}
                              className="category-link sub-category"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              {subcat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
