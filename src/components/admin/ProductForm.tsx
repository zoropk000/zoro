import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type ProductPayload } from "@/services/adminService";
import type { Product, ProductImage } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminCard } from "./AdminLayout";

const DEFAULT_SIZES = ["39", "40", "41", "42", "43", "44"].map((size) => ({ size, stock: 0 }));

type FormState = ProductPayload;

function initialState(product?: Product): FormState {
  return {
    name: product?.name || "",
    nameUrdu: product?.nameUrdu || "",
    slug: product?.slug || "",
    gender: product?.gender || "men",
    sku: product?.sku || "",
    price: product?.price || 0,
    oldPrice: product?.oldPrice || undefined,
    description: product?.description.join("\n") || "",
    descriptionUrdu: product?.descriptionUrdu?.join("\n") || "",
    shortDescription: product?.shortDescription || "",
    shortDescriptionUrdu: product?.shortDescriptionUrdu || "",
    images: product?.imageObjects || [],
    sizes: product?.sizes?.length ? product.sizes : DEFAULT_SIZES,
    colors: product?.colors || [],
    featured: Boolean(product?.featured),
    bestSeller: Boolean(product?.bestSeller),
    newArrival: Boolean(product?.newArrival),
    onSale: Boolean(product?.onSale),
    status: product?.status || "draft",
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [colorInput, setColorInput] = useState((product?.colors || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const errors = useMemo(() => validate(form), [form]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;
    if (form.images.length + selected.length > 8) {
      toast.error("You can upload up to 8 product images.");
      return;
    }
    try {
      setUploading(true);
      const response = await adminApi.uploadImages(selected);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...response.images] }));
      toast.success("Images uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (publicId: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image.publicId !== publicId),
    }));
  };

  const makePrimary = (image: ProductImage) => {
    setForm((prev) => ({
      ...prev,
      images: [image, ...prev.images.filter((item) => item.publicId !== image.publicId)],
    }));
  };

  const save = async (status: "draft" | "active") => {
    const payload = {
      ...form,
      status,
      colors: colorInput
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      price: Number(form.price),
    };
    const validation = validate(payload);
    if (Object.keys(validation).length) {
      toast.error(Object.values(validation)[0]);
      return;
    }
    try {
      setSaving(true);
      if (product) {
        await adminApi.updateProduct(product.id, payload);
        toast.success("Product updated successfully.");
      } else {
        await adminApi.createProduct(payload);
        toast.success(status === "active" ? "Product published successfully." : "Draft saved.");
      }
      navigate({ to: "/admin/products" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  function updateSize(index: number, key: "size" | "stock", value: string | number) {
    setField(
      "sizes",
      form.sizes.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <AdminCard>
          <SectionTitle title="Basic Information" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name" error={errors.name}>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </Field>
            <Field label="Urdu product name">
              <Input
                value={form.nameUrdu}
                onChange={(e) => setField("nameUrdu", e.target.value)}
                dir="rtl"
              />
            </Field>
            <Field label="Gender" error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value as "men" | "women")}
                className="h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </Field>
            <Field label="SKU">
              <Input
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle title="Pricing" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Price" error={errors.price}>
              <Input
                type="number"
                min="1"
                value={form.price || ""}
                onChange={(e) => setField("price", Number(e.target.value))}
              />
            </Field>
            <Field label="Old price">
              <Input
                type="number"
                min="0"
                value={form.oldPrice || ""}
                onChange={(e) =>
                  setField("oldPrice", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle title="Description" />
          <div className="space-y-4">
            <Field label="English short description">
              <Input
                value={form.shortDescription}
                onChange={(e) => setField("shortDescription", e.target.value)}
              />
            </Field>
            <Field label="Urdu short description">
              <Input
                value={form.shortDescriptionUrdu}
                onChange={(e) => setField("shortDescriptionUrdu", e.target.value)}
                dir="rtl"
              />
            </Field>
            <Field label="English description">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </Field>
            <Field label="Urdu description">
              <Textarea
                rows={5}
                value={form.descriptionUrdu}
                onChange={(e) => setField("descriptionUrdu", e.target.value)}
                dir="rtl"
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle
            title="Images"
            subtitle="Upload JPG, JPEG, PNG, or WEBP. Maximum 8 images."
          />
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles(e.dataTransfer.files);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100"
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
            ) : (
              <UploadCloud className="h-10 w-10 text-slate-500" />
            )}
            <div className="mt-3 text-lg font-black text-slate-950">
              {uploading ? "Uploading images..." : "Upload Images"}
            </div>
            <div className="text-sm text-slate-500">Drag & drop or click</div>
            <input
              hidden
              multiple
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
          </label>
          {errors.images && (
            <p className="mt-2 text-sm font-semibold text-destructive">{errors.images}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((image, index) => (
              <div
                key={image.publicId}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                    Primary
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/60 p-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => makePrimary(image)}
                    className="flex-1 rounded-md bg-white px-2 py-1 text-xs font-bold"
                  >
                    <Star className="mx-auto h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.publicId)}
                    className="flex-1 rounded-md bg-white px-2 py-1 text-xs font-bold text-rose-600"
                  >
                    <Trash2 className="mx-auto h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle title="Sizes and Stock" />
          <div className="space-y-3">
            {form.sizes.map((row, index) => (
              <div key={`${row.size}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <Input
                  value={row.size}
                  onChange={(e) => updateSize(index, "size", e.target.value)}
                  placeholder="Size"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.stock}
                  onChange={(e) => updateSize(index, "stock", Number(e.target.value))}
                  placeholder="Stock"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setField(
                      "sizes",
                      form.sizes.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.sizes && (
              <p className="text-sm font-semibold text-destructive">{errors.sizes}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setField("sizes", [...form.sizes, { size: "", stock: 0 }])}
            >
              Add size
            </Button>
          </div>
        </AdminCard>
      </div>

      <div className="space-y-5">
        <AdminCard>
          <SectionTitle title="Product Options" />
          <div className="space-y-4">
            <Toggle
              label="Featured"
              value={form.featured}
              onChange={(v) => setField("featured", v)}
            />
            <Toggle
              label="Best Seller"
              value={form.bestSeller}
              onChange={(v) => setField("bestSeller", v)}
            />
            <Toggle
              label="New Arrival"
              value={form.newArrival}
              onChange={(v) => setField("newArrival", v)}
            />
            <Toggle label="On Sale" value={form.onSale} onChange={(v) => setField("onSale", v)} />
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle title="Status" />
          <select
            value={form.status}
            onChange={(e) => setField("status", e.target.value as FormState["status"])}
            className="h-11 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </AdminCard>

        <AdminCard>
          <SectionTitle title="Colors" subtitle="Comma separated color names." />
          <Input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            placeholder="Black, White, Brown"
          />
        </AdminCard>

        <div className="grid gap-3">
          <Button
            disabled={saving || uploading}
            onClick={() => save("active")}
            className="h-12 text-base font-black"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Publish Product
          </Button>
          <Button
            disabled={saving || uploading}
            onClick={() => save("draft")}
            variant="outline"
            className="h-12 text-base font-black"
          >
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}

function validate(form: ProductPayload) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Product name is required.";
  if (!["men", "women"].includes(form.gender)) errors.gender = "Please select Men or Women.";
  if (!Number(form.price) || Number(form.price) <= 0)
    errors.price = "Price must be greater than zero.";
  if (form.status === "active" && form.images.length === 0)
    errors.images = "Upload at least one product image.";
  if (!form.sizes.length || form.sizes.some((row) => !row.size || Number(row.stock) < 0)) {
    errors.sizes = "Sizes are required and stock cannot be negative.";
  }
  return errors;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block font-bold text-slate-700">{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
      <span className="font-bold text-slate-700">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
