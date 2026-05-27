import { useParams } from "react-router-dom";
import ProductDetailsCard from "../components/ProductDetails/ProductDetailsCard";

export default function ProductDetails() {
  const { productId } = useParams();
  const isValidId = /^[a-f\d]{24}$/i.test(productId);
  if (!isValidId) {
    return (
      <div className="search-results-message">ID de producto inválido.</div>
    );
  }
  return <ProductDetailsCard productId={productId} />;
}
