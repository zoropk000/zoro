import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit, Eye, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard, AdminLayout, StatusBadge } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import type { Product } from "@/services/productService";
import { formatPKR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products - ZORO Admin" }] }),
  component: AdminProducts,
});

function AdminProducts() {
  const location = useLocation();
  return location.pathname !== "/admin/products" ? <Outlet /> : <AdminProductsIndex />;
}

function AdminProductsIndex() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockRows, setStockRows] = useState<{ size: string; stock: number }[]>([]);
  const [savingStock, setSavingStock] = useState(false);
  const queryClient = useQueryClient();
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (gender) params.set("gender", gender);
  if (status) params.set("status", status);
  if (stock) params.set("stock", stock);
  const query = params.toString() ? `?${params}` : "";
  const products = useQuery({
    queryKey: ["admin-products", query],
    queryFn: () => adminApi.products(query),
  });

  const deleteProduct = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteProduct(deleteId);
      toast.success("Product deleted.");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete product.");
    }
  };

  const openStockEditor = (product: Product) => {
    setStockProduct(product);
    setStockRows(
      product.sizes.length ? product.sizes.map((row) => ({ ...row })) : [{ size: "", stock: 0 }],
    );
  };

  const saveStock = async () => {
    if (!stockProduct) return;
    const cleanRows = stockRows
      .map((row) => ({ size: row.size.trim(), stock: Number(row.stock || 0) }))
      .filter((row) => row.size);

    if (!cleanRows.length) {
      toast.error("Add at least one size.");
      return;
    }
    if (cleanRows.some((row) => row.stock < 0)) {
      toast.error("Stock cannot be negative.");
      return;
    }

    try {
      setSavingStock(true);
      const total = cleanRows.reduce((sum, row) => sum + row.stock, 0);
      await adminApi.updateInventory(stockProduct.id, {
        sizes: cleanRows,
        status: total > 0 ? "active" : "out-of-stock",
      });
      toast.success(total > 0 ? "Stock updated and product activated." : "Stock updated.");
      setStockProduct(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update stock.");
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <AdminLayout title="Products">
      <AdminCard>
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="">Men/Women</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="">Stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </AdminCard>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th>Gender</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.data?.products.map((product: Product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0] || "/logo.png"}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-black">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.sku || product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="capitalize">{product.gender}</td>
                  <td className="font-bold">{formatPKR(product.price)}</td>
                  <td>
                    <button
                      onClick={() => openStockEditor(product)}
                      className="rounded-lg px-2 py-1 text-left hover:bg-slate-100"
                    >
                      <span
                        className={
                          product.totalStock > 0 && product.totalStock <= 5
                            ? "font-black text-amber-600"
                            : "font-bold"
                        }
                      >
                        {product.totalStock}
                      </span>
                      <div className="text-[11px] font-bold text-slate-500">Edit stock</div>
                    </button>
                  </td>
                  <td>
                    <StatusBadge value={product.status} />
                  </td>
                  <td>
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="pr-4 text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link to="/product/$slug" params={{ slug: product.slug }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link to="/admin/products/$id/edit" params={{ id: product.id }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openStockEditor(product)}>
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.isLoading && products.data?.products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove the product and its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!stockProduct} onOpenChange={(open) => !open && setStockProduct(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Add quantity by size. Saving with stock above zero will make the product active and
              visible on the customer website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {stockRows.map((row, index) => (
              <div key={`${row.size}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <Input
                  value={row.size}
                  onChange={(event) =>
                    setStockRows((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, size: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Size"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.stock}
                  onChange={(event) =>
                    setStockRows((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, stock: Number(event.target.value) } : item,
                      ),
                    )
                  }
                  placeholder="Quantity"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStockRows((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              type="button"
              onClick={() => setStockRows((rows) => [...rows, { size: "", stock: 0 }])}
            >
              Add size
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockProduct(null)}>
              Cancel
            </Button>
            <Button onClick={saveStock} disabled={savingStock}>
              {savingStock ? "Saving..." : "Save Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
