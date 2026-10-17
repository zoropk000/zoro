import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, LogOut, Package } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useCustomer } from "@/lib/customer-context";
import { apiRequest } from "@/services/api";
import { formatPKR } from "@/lib/currency";
import type { AdminOrder } from "@/services/adminService";
export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account - ZORO" }] }),
  component: Account,
});
function Account() {
  const { customer, loading, authenticate, logout } = useCustomer();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const orders = useQuery({
    queryKey: ["account-orders", customer?.id],
    queryFn: () => apiRequest<{ orders: AdminOrder[] }>("/account/orders"),
    enabled: !!customer,
    retry: false,
  });
  if (loading)
    return (
      <Layout>
        <div className="collection-empty">Loading your account…</div>
      </Layout>
    );
  return (
    <Layout>
      {customer ? (
        <>
          <div className="catalog-header">
            <div className="store-container">
              <span className="small-eyebrow">YOUR LITTLE CORNER OF ZORO</span>
              <h1>Hello, {customer.name.split(" ")[0]}.</h1>
              <p>{customer.email}</p>
              <div className="mt-5 flex gap-6">
                <Link className="text-link" to="/wishlist">
                  Your wishlist <ArrowUpRight size={16} />
                </Link>
                <button
                  className="text-link"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch {
                      setError("Could not sign out. Please try again.");
                    }
                  }}
                >
                  Sign out <LogOut size={14} />
                </button>
              </div>
              {error && (
                <p role="alert" className="form-error mt-4">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="store-container account-orders">
            <h2 className="text-2xl font-medium">Your orders</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Orders placed while signed in appear here. For guest orders, use{" "}
              <Link to="/track-order" className="underline">
                order tracking
              </Link>
              .
            </p>
            {orders.isLoading ? (
              <p className="py-10 text-sm">Loading your orders…</p>
            ) : orders.isError ? (
              <div className="collection-empty">
                <p>We couldn’t load your orders.</p>
                <button className="text-link" onClick={() => orders.refetch()}>
                  Try again
                </button>
              </div>
            ) : orders.data?.orders.length ? (
              orders.data.orders.map((order) => (
                <article key={order._id} className="order-history-card">
                  <div>
                    <h3>#{order.orderNumber}</h3>
                    <span>
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                      {formatPKR(order.total)}
                    </span>
                    <small>{new Date(order.createdAt).toLocaleDateString("en-PK")}</small>
                  </div>
                  <div>
                    <span className="capitalize">{order.orderStatus.replace(/_/g, " ")}</span>
                    <Link
                      to="/track-order"
                      search={{ orderNumber: order.orderNumber, phone: order.customer.phone }}
                      className="text-link ml-5"
                    >
                      View order <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="collection-empty mt-6">
                <Package size={28} strokeWidth={1} />
                <h3>Your first find is out there.</h3>
                <Link to="/shop" className="text-link">
                  Explore the collection <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="account-card">
          <span className="small-eyebrow">WELCOME TO ZORO</span>
          <h1>{mode === "login" ? "Good to see you." : "Make yourself at home."}</h1>
          <p>
            {mode === "login"
              ? "Sign in for saved favourites and your order history."
              : "Create an account to keep your everyday finds together."}
          </p>
          <form
            className="store-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              try {
                await authenticate(mode, { name, email, password });
                setPassword("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            {mode === "register" && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 10 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {mode === "register" && (
                <small className="text-muted-foreground">Use at least 10 characters.</small>
              )}
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="store-button" disabled={pending}>
              {pending ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="account-switch">
            {mode === "login" ? "New here? " : "Already part of ZORO? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
          <Link className="text-link mt-5" to="/shop">
            Continue shopping as a guest <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </Layout>
  );
}
