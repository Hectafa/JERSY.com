import { useParams } from "react-router-dom";
import CategoryProducts from "../components/CategoryProducts/CategoryProducts";

export default function CategoryPage() {
  const { categoryId } = useParams();
  return <CategoryProducts categoryId={categoryId} />;
}
