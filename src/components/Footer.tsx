import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40 pb-24 pt-12 md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/men" className="hover:text-primary">Men</Link></li>
            <li><Link to="/women" className="hover:text-primary">Women</Link></li>
            <li><Link to="/shop" className="hover:text-primary">All Shoes</Link></li>
            <li><Link to="/sale" className="hover:text-primary">Sale</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/size-guide" className="hover:text-primary">Size Guide</Link></li>
            <li><Link to="/track-order" className="hover:text-primary">Track Order</Link></li>
            <li><Link to="/delivery" className="hover:text-primary">Delivery Information</Link></li>
            <li><Link to="/returns" className="hover:text-primary">Returns & Exchange</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {siteConfig.phone}
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp: {siteConfig.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {siteConfig.email}
            </li>
          </ul>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            💵 Cash on Delivery
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-border px-4 pt-6 text-center text-xs text-muted-foreground">
        Secure Ordering • Cash on Delivery • Delivery Across Pakistan
        <div className="mt-2">© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</div>
      </div>
    </footer>
  );
}
