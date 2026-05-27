import { useParams } from "react-router-dom";
import ProductDetails from "../components/ProductDetails/ProductDetails";

export default function Product() {
  const { productId } = useParams();

  return <ProductDetails productId={productId} />;
}
