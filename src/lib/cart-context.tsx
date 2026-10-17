import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProducts, type Product } from "@/services/productService";
export type CartItem = { productId: string; size: string; quantity: number; color?: string };
export type CartLine = CartItem & { product: Product };
type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  isLoading: boolean;
  loadError: boolean;
  unavailableCount: number;
  refresh: () => void;
  addItem: (productId: string, size: string | number, quantity?: number, color?: string) => boolean;
  removeItem: (productId: string, size: string | number, color?: string) => void;
  updateQuantity: (
    productId: string,
    size: string | number,
    quantity: number,
    color?: string,
  ) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "stepstyle_cart_v1";
const matches = (item: CartItem, id: string, size: string, color = "") =>
  item.productId === id && item.size === size && (item.color || "") === color;
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored))
        setItems(
          stored
            .filter(
              (item) =>
                item?.productId &&
                item?.size &&
                Number.isSafeInteger(Number(item.quantity)) &&
                Number(item.quantity) > 0,
            )
            .map((item) => ({
              productId: String(item.productId),
              size: String(item.size),
              quantity: Math.min(100, Number(item.quantity)),
              color: typeof item.color === "string" ? item.color : "",
            })),
        );
    } catch {
      /* Keep shopping available when storage is disabled. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        /* storage unavailable */
      }
  }, [items, hydrated]);
  const ids = [...new Set(items.map((item) => item.productId))].sort();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cart-products", ids],
    queryFn: () => getProducts({ ids, limit: 100 }),
    enabled: hydrated && ids.length > 0,
    staleTime: 30_000,
  });
  const products = useMemo(
    () => Object.fromEntries((data?.products || []).map((p) => [p.id, p])),
    [data],
  );
  const lines: CartLine[] = items.flatMap((item) =>
    products[item.productId] ? [{ ...item, product: products[item.productId] }] : [],
  );
  const addItem: CartContextValue["addItem"] = (productId, size, quantity = 1, color = "") => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const normalizedSize = String(size);
    const stock = products[productId]?.sizes.find((s) => s.size === normalizedSize)?.stock;
    const total =
      items
        .filter((i) => i.productId === productId && i.size === normalizedSize)
        .reduce((sum, i) => sum + i.quantity, 0) + quantity;
    if (total > 100 || (stock !== undefined && total > stock)) {
      toast.error("That quantity is not available. Please check your bag.");
      return false;
    }
    setItems((previous) =>
      previous.some((i) => matches(i, productId, normalizedSize, color))
        ? previous.map((i) =>
            matches(i, productId, normalizedSize, color)
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...previous, { productId, size: normalizedSize, quantity, color }],
    );
    toast.success("Added to your shopping bag");
    return true;
  };
  const removeItem: CartContextValue["removeItem"] = (id, size, color = "") => {
    setItems((previous) => previous.filter((i) => !matches(i, id, String(size), color)));
    toast("Removed from your bag");
  };
  const updateQuantity: CartContextValue["updateQuantity"] = (id, size, quantity, color = "") => {
    if (quantity <= 0) return removeItem(id, size, color);
    const stock = products[id]?.sizes.find((s) => s.size === String(size))?.stock ?? 100;
    const other = items
      .filter(
        (i) =>
          i.productId === id && i.size === String(size) && !matches(i, id, String(size), color),
      )
      .reduce((sum, i) => sum + i.quantity, 0);
    if (!Number.isSafeInteger(quantity) || quantity > Math.min(100, stock - other)) {
      toast.error("You’ve reached the available stock for this option.");
      return;
    }
    setItems((previous) =>
      previous.map((i) => (matches(i, id, String(size), color) ? { ...i, quantity } : i)),
    );
  };
  return (
    <CartContext.Provider
      value={{
        items,
        lines,
        count: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: lines.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
        isLoading: !hydrated || (ids.length > 0 && isLoading),
        loadError: isError && ids.length > 0,
        unavailableCount: items.length - lines.length,
        refresh: () => {
          refetch();
        },
        addItem,
        removeItem,
        updateQuantity,
        clearCart: () => setItems([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is missing");
  return value;
}
