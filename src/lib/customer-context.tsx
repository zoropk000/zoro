import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiClientError } from "@/services/api";
import { toast } from "sonner";

export type Customer = { id: string; name: string; email: string; wishlist: string[] };
type Value = {
  customer?: Customer;
  loading: boolean;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  authenticate: (
    mode: "login" | "register",
    data: { name?: string; email: string; password: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Value | null>(null);
const KEY = "zoro_wishlist_v1";

export function CustomerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const syncQueue = useRef(Promise.resolve());
  const { data, isLoading } = useQuery({
    queryKey: ["customer"],
    queryFn: async () => {
      try {
        return (await apiRequest<{ customer: Customer }>("/account/me")).customer;
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(ids)) setWishlist(ids.filter((id) => typeof id === "string").slice(0, 200));
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (data) setWishlist(data.wishlist);
  }, [data?.id]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(KEY, JSON.stringify(wishlist));
      } catch {
        /* storage unavailable */
      }
  }, [wishlist, ready]);
  const toggleWishlist = (id: string) => {
    const next = wishlist.includes(id)
      ? wishlist.filter((value) => value !== id)
      : [...wishlist, id].slice(0, 200);
    setWishlist(next);
    if (data)
      syncQueue.current = syncQueue.current
        .then(() =>
          apiRequest("/account/wishlist", { method: "PUT", body: JSON.stringify({ ids: next }) }),
        )
        .then(() => undefined)
        .catch(() => {
          toast.error("Saved on this device. Account sync failed; please try again.");
        });
    toast.success(next.includes(id) ? "Added to your wishlist" : "Removed from your wishlist");
  };
  const authenticate: Value["authenticate"] = async (mode, input) => {
    const result = await apiRequest<{ customer: Customer }>(`/account/${mode}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    const merged = [...new Set([...result.customer.wishlist, ...wishlist])].slice(0, 200);
    await apiRequest("/account/wishlist", { method: "PUT", body: JSON.stringify({ ids: merged }) });
    setWishlist(merged);
    queryClient.setQueryData(["customer"], { ...result.customer, wishlist: merged });
    queryClient.invalidateQueries({ queryKey: ["account-orders"] });
  };
  const logout = async () => {
    await syncQueue.current;
    await apiRequest("/account/logout", { method: "POST", body: "{}" });
    queryClient.setQueryData(["customer"], null);
    queryClient.removeQueries({ queryKey: ["account-orders"] });
    setWishlist([]);
  };
  return (
    <Context.Provider
      value={{
        customer: data || undefined,
        loading: isLoading,
        wishlist,
        toggleWishlist,
        authenticate,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCustomer() {
  const value = useContext(Context);
  if (!value) throw new Error("CustomerProvider is missing");
  return value;
}
