import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout, AdminCard } from "@/components/admin/AdminLayout";
import { apiRequest } from "@/services/api";
import { adminApi } from "@/services/adminService";
import {
  slugify,
  type Storefront,
  type Category,
  type Coupon,
  type Promotion,
} from "@/services/storefrontService";
export const Route = createFileRoute("/admin/storefront")({
  head: () => ({ meta: [{ title: "Storefront Settings - ZORO Admin" }] }),
  component: StorefrontSettings,
});
const dateInput = (date: string) =>
  date
    ? new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
const dateValue = (value: string) => (value ? new Date(value).toISOString() : "");
function StorefrontSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-storefront"],
    queryFn: () => apiRequest<Storefront>("/admin/storefront"),
    retry: false,
  });
  const [form, setForm] = useState<Storefront | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (data && !form) setForm(structuredClone(data));
  }, [data, form]);
  const category = (index: number, change: Partial<Category>) =>
    setForm(
      (f) =>
        f && {
          ...f,
          categories: f.categories.map((c, i) => (i === index ? { ...c, ...change } : c)),
        },
    );
  const promotion = (index: number, change: Partial<Promotion>) =>
    setForm(
      (f) =>
        f && {
          ...f,
          promotions: f.promotions.map((p, i) => (i === index ? { ...p, ...change } : p)),
        },
    );
  const coupon = (index: number, change: Partial<Coupon>) =>
    setForm(
      (f) =>
        f && { ...f, coupons: f.coupons!.map((c, i) => (i === index ? { ...c, ...change } : c)) },
    );
  const uploadImage = async (file: File | undefined, done: (url: string) => void) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await adminApi.uploadImages([file]);
      done(result.images[0].url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const saved = await apiRequest<Storefront>("/admin/storefront", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setForm(structuredClone(saved));
      queryClient.setQueryData(["admin-storefront"], saved);
      await queryClient.invalidateQueries({ queryKey: ["storefront"] });
      toast.success("Storefront updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save storefront");
    } finally {
      setSaving(false);
    }
  };
  return (
    <AdminLayout title="Storefront">
      <div className="admin-store-form space-y-5">
        {isLoading ? (
          <AdminCard>Loading storefront settings…</AdminCard>
        ) : isError || !form ? (
          <AdminCard>
            <p>Could not load storefront configuration.</p>
            <button className="text-link" onClick={() => refetch()}>
              Try again
            </button>
          </AdminCard>
        ) : (
          <>
            <AdminCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Your store, your way</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage departments, brands, banners and discounts. Changes go live when you
                    save.
                  </p>
                </div>
                <button className="store-button" onClick={save} disabled={saving || uploading}>
                  <Save size={16} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
              {error && (
                <p role="alert" className="form-error mt-4">
                  {error}
                </p>
              )}
            </AdminCard>
            <AdminCard>
              <ConfigTitle
                title="Categories & subcategories"
                description="Add a department, then place subcategories beneath it. Keep slugs stable because products and links use them. Hide categories instead of deleting ones still in use."
              />
              {form.categories.map((c, i) => (
                <div key={i} className="border-b border-slate-200 py-3">
                  <div className="admin-config-row border-0 p-0">
                    <Field label="Name">
                      <input
                        value={c.name}
                        onChange={(e) =>
                          category(i, {
                            name: e.target.value,
                            ...(!c.slug ? { slug: slugify(e.target.value) } : {}),
                          })
                        }
                      />
                    </Field>
                    <Field label="Slug">
                      <input
                        value={c.slug}
                        onChange={(e) => category(i, { slug: slugify(e.target.value) })}
                      />
                    </Field>
                    <Field label="Parent department">
                      <select
                        value={c.parent}
                        onChange={(e) =>
                          category(i, {
                            parent: e.target.value,
                            type:
                              form.categories.find((p) => p.slug === e.target.value)?.type ||
                              c.type,
                          })
                        }
                      >
                        <option value="">Top-level department</option>
                        {form.categories
                          .filter((p) => !p.parent && p.slug && p.slug !== c.slug)
                          .map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Product type">
                      <select
                        value={c.type}
                        disabled={!!c.parent}
                        onChange={(e) => category(i, { type: e.target.value })}
                      >
                        {["clothing", "shoes", "perfumes", "accessories", "general"].map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                    <button
                      className="p-2 text-red-600"
                      aria-label={`Remove ${c.name || "category"}`}
                      onClick={() =>
                        setForm({ ...form, categories: form.categories.filter((_, n) => n !== i) })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="check-label !flex-row items-center">
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={(e) => category(i, { active: e.target.checked })}
                      />
                      Visible
                    </label>
                    {!c.parent && (
                      <>
                        <input
                          className="max-w-xs"
                          aria-label={`${c.name} image URL`}
                          placeholder="Image URL (optional)"
                          value={c.image}
                          onChange={(e) => category(i, { image: e.target.value })}
                        />
                        <label className="!flex-row items-center cursor-pointer">
                          <Upload size={15} />
                          Upload image
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploading}
                            className="hidden"
                            onChange={(e) =>
                              uploadImage(e.target.files?.[0], (url) => category(i, { image: url }))
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                className="text-link mt-4"
                onClick={() =>
                  setForm({
                    ...form,
                    categories: [
                      ...form.categories,
                      {
                        name: "",
                        slug: "",
                        parent: "",
                        type: "general",
                        active: true,
                        image: "",
                        order: form.categories.length,
                      },
                    ],
                  })
                }
              >
                <Plus size={15} />
                Add category
              </button>
            </AdminCard>
            <AdminCard>
              <ConfigTitle
                title="Brands"
                description="One brand per line. Brands become selectable when adding products."
              />
              <textarea
                aria-label="Brands"
                rows={5}
                value={form.brands.join("\n")}
                onChange={(e) => setForm({ ...form, brands: e.target.value.split("\n") })}
              />
            </AdminCard>
            <AdminCard>
              <ConfigTitle
                title="Promotional banners & flash deals"
                description="Campaigns appear on the homepage while active. A real end date enables the countdown; expired campaigns disappear automatically. Dates use your local timezone."
              />
              {form.promotions.map((p, i) => (
                <div key={p.id} className="mb-5 border border-slate-200 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Campaign title">
                      <input
                        value={p.title}
                        onChange={(e) => promotion(i, { title: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Subtitle">
                      <input
                        value={p.subtitle}
                        onChange={(e) => promotion(i, { subtitle: e.target.value })}
                      />
                    </Field>
                    <Field label="Department">
                      <select
                        value={p.category}
                        onChange={(e) => promotion(i, { category: e.target.value })}
                      >
                        <option value="">All sale products</option>
                        {form.categories
                          .filter((c) => !c.parent)
                          .map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Image URL">
                      <input
                        value={p.image}
                        onChange={(e) => promotion(i, { image: e.target.value })}
                      />
                    </Field>
                    <Field label="Starts at (optional)">
                      <input
                        type="datetime-local"
                        value={dateInput(p.startsAt)}
                        onChange={(e) => promotion(i, { startsAt: dateValue(e.target.value) })}
                      />
                    </Field>
                    <Field label="Ends at (optional)">
                      <input
                        type="datetime-local"
                        value={dateInput(p.endsAt)}
                        onChange={(e) => promotion(i, { endsAt: dateValue(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <label className="!flex-row items-center">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) => promotion(i, { active: e.target.checked })}
                      />
                      Active
                    </label>
                    <label className="!flex-row items-center cursor-pointer">
                      <Upload size={15} />
                      Upload banner
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={(e) =>
                          uploadImage(e.target.files?.[0], (url) => promotion(i, { image: url }))
                        }
                      />
                    </label>
                    <button
                      aria-label="Remove campaign"
                      className="text-red-600"
                      onClick={() =>
                        setForm({ ...form, promotions: form.promotions.filter((_, n) => n !== i) })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="text-link"
                onClick={() =>
                  setForm({
                    ...form,
                    promotions: [
                      ...form.promotions,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        subtitle: "",
                        category: "",
                        image: "",
                        active: false,
                        startsAt: "",
                        endsAt: "",
                      },
                    ],
                  })
                }
              >
                <Plus size={15} />
                Add campaign
              </button>
            </AdminCard>
            <AdminCard>
              <ConfigTitle
                title="Discount codes"
                description="Discounts are verified and recalculated by the server at checkout. Minimum spend is calculated before delivery."
              />
              {(form.coupons || []).map((c, i) => (
                <div key={i} className="mb-4 border border-slate-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Code">
                      <input
                        value={c.code}
                        maxLength={30}
                        onChange={(e) => coupon(i, { code: e.target.value.toUpperCase() })}
                      />
                    </Field>
                    <Field label="Discount type">
                      <select
                        value={c.type}
                        onChange={(e) => coupon(i, { type: e.target.value as Coupon["type"] })}
                      >
                        <option value="percent">Percentage</option>
                        <option value="fixed">Fixed PKR</option>
                      </select>
                    </Field>
                    <Field label="Value">
                      <input
                        type="number"
                        min="1"
                        max={c.type === "percent" ? 100 : undefined}
                        value={c.value}
                        onChange={(e) => coupon(i, { value: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Minimum spend (PKR)">
                      <input
                        type="number"
                        min="0"
                        value={c.minSpend}
                        onChange={(e) => coupon(i, { minSpend: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Starts at">
                      <input
                        type="datetime-local"
                        value={dateInput(c.startsAt)}
                        onChange={(e) => coupon(i, { startsAt: dateValue(e.target.value) })}
                      />
                    </Field>
                    <Field label="Ends at">
                      <input
                        type="datetime-local"
                        value={dateInput(c.endsAt)}
                        onChange={(e) => coupon(i, { endsAt: dateValue(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="!flex-row items-center">
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={(e) => coupon(i, { active: e.target.checked })}
                      />
                      Active
                    </label>
                    <button
                      aria-label="Remove discount code"
                      className="text-red-600"
                      onClick={() =>
                        setForm({ ...form, coupons: form.coupons!.filter((_, n) => n !== i) })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="text-link"
                onClick={() =>
                  setForm({
                    ...form,
                    coupons: [
                      ...(form.coupons || []),
                      {
                        code: "",
                        type: "percent",
                        value: 10,
                        minSpend: 0,
                        active: false,
                        startsAt: "",
                        endsAt: "",
                      },
                    ],
                  })
                }
              >
                <Plus size={15} />
                Add discount code
              </button>
            </AdminCard>
            <button className="store-button" onClick={save} disabled={saving || uploading}>
              <Save size={16} />
              {saving ? "Saving…" : "Save storefront changes"}
            </button>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
function ConfigTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
