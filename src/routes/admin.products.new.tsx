import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({ meta: [{ title: "Add Product - ZORO Admin" }] }),
  component: AddProduct,
});

function AddProduct() {
  return (
    <AdminLayout title="Add Product">
      <ProductForm />
    </AdminLayout>
  );
}
