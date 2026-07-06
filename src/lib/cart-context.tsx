import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { products, type Product } from "@/data/products";

export type CartItem = {
  productId: number;
  size: number;
  quantity: number;
};

export type CartLine = CartItem & { product: Product };

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (productId: number, size: number, quantity?: number) => void;
  removeItem: (productId: number, size: number) => void;
  updateQuantity: (productId: number, size: number, quantity: number) => void;
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
    return parsed;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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

  const addItem = (productId: number, size: number, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { productId, size, quantity }];
    });
    toast.success("Added to Cart");
  };

  const removeItem = (productId: number, size: number) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
    toast("Removed from Cart");
  };

  const updateQuantity = (productId: number, size: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size ? { ...i, quantity } : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const lines: CartLine[] = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return product ? { ...i, product } : null;
    })
    .filter((l): l is CartLine => l !== null);

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, lines, count, subtotal, addItem, removeItem, updateQuantity, clearCart }}
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
