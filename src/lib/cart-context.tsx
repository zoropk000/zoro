import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getProducts, type Product } from "@/services/productService";

export type CartItem = {
  productId: string;
  size: string;
  quantity: number;
};

export type CartLine = CartItem & { product: Product };

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId: string, size: string | number, quantity?: number) => void;
  removeItem: (productId: string, size: string | number) => void;
  updateQuantity: (productId: string, size: string | number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "stepstyle_cart_v1";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.productId && item?.size && Number(item.quantity) > 0)
      .map((item) => ({
        productId: String(item.productId),
        size: String(item.size),
        quantity: Number(item.quantity),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  useEffect(() => {
    const ids = [...new Set(items.map((item) => item.productId))];
    if (!ids.length) {
      setProductsById({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    getProducts({ ids, limit: ids.length })
      .then((data) => {
        if (cancelled) return;
        setProductsById(Object.fromEntries(data.products.map((product) => [product.id, product])));
      })
      .catch(() => {
        if (!cancelled) setProductsById({});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const addItem = (productId: string, size: string | number, quantity = 1) => {
    const normalizedId = String(productId);
    const normalizedSize = String(size);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === normalizedId && i.size === normalizedSize);
      if (existing) {
        return prev.map((i) =>
          i.productId === normalizedId && i.size === normalizedSize
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { productId: normalizedId, size: normalizedSize, quantity }];
    });
    toast.success("Added to Cart");
  };

  const removeItem = (productId: string, size: string | number) => {
    const normalizedId = String(productId);
    const normalizedSize = String(size);
    setItems((prev) =>
      prev.filter((i) => !(i.productId === normalizedId && i.size === normalizedSize)),
    );
    toast("Removed from Cart");
  };

  const updateQuantity = (productId: string, size: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    const normalizedId = String(productId);
    const normalizedSize = String(size);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === normalizedId && i.size === normalizedSize ? { ...i, quantity } : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const lines: CartLine[] = useMemo(
    () =>
      items
        .map((i) => {
          const product = productsById[i.productId];
          return product ? { ...i, product } : null;
        })
        .filter((l): l is CartLine => l !== null),
    [items, productsById],
  );

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        lines,
        count,
        subtotal,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
