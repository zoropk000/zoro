import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminApi } from "@/services/adminService";

export const Route = createFileRoute("/admin/products/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Product - ZORO Admin" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const product = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => adminApi.product(id),
  });

  return (
    <AdminLayout title="Edit Product">
      {product.isLoading ? (
        <AdminCard>Loading product...</AdminCard>
      ) : product.isError || !product.data?.product ? (
        <AdminCard>Product not found.</AdminCard>
      ) : (
        <ProductForm product={product.data.product} />
      )}
    </AdminLayout>
  );
}
