import { Link } from "@tanstack/react-router";
import {
  Mail,
  MessageCircle,
  Phone,
  Instagram,
  Facebook,
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40 pb-24 pt-12 md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Shop */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
            Shop
          </h4>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link
                to="/men"
                className="transition-colors hover:text-primary"
              >
                Men
              </Link>
            </li>

            <li>
              <Link
                to="/women"
                className="transition-colors hover:text-primary"
              >
                Women
              </Link>
            </li>

            <li>
              <Link
                to="/shop"
                className="transition-colors hover:text-primary"
              >
                All Shoes
              </Link>
            </li>

            <li>
              <Link
                to="/sale"
                className="transition-colors hover:text-primary"
              >
                Sale
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
            Help
          </h4>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link
                to="/size-guide"
                className="transition-colors hover:text-primary"
              >
                Size Guide
              </Link>
            </li>

            <li>
              <Link
                to="/track-order"
                className="transition-colors hover:text-primary"
              >
                Track Order
              </Link>
            </li>

            <li>
              <Link
                to="/delivery"
                className="transition-colors hover:text-primary"
              >
                Delivery Information
              </Link>
            </li>

            <li>
              <Link
                to="/returns"
                className="transition-colors hover:text-primary"
              >
                Returns & Exchange
              </Link>
            </li>

            <li>
              <Link
                to="/faq"
                className="transition-colors hover:text-primary"
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
            Company
          </h4>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link
                to="/about"
                className="transition-colors hover:text-primary"
              >
                About Us
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="transition-colors hover:text-primary"
              >
                Contact Us
              </Link>
            </li>

            <li>
              <Link
                to="/privacy"
                className="transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link
                to="/terms"
                className="transition-colors hover:text-primary"
              >
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
            Contact
          </h4>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{siteConfig.phone}</span>
            </li>

            <li className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <span>WhatsApp: {siteConfig.phone}</span>
            </li>

            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="break-all">{siteConfig.email}</span>
            </li>
          </ul>

          {/* Social Media */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
              Follow Us
            </p>

            <div className="flex flex-wrap gap-2">
              {/* Instagram */}
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow StepStyle Pakistan on Instagram"
                className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E1306C]/40 hover:shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]">
                  <Instagram className="h-4 w-4 text-white" />
                </div>

                <span className="text-xs font-semibold text-foreground group-hover:text-[#E1306C]">
                  Instagram
                </span>
              </a>

              {/* Facebook */}
              <a
                href={siteConfig.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow StepStyle Pakistan on Facebook"
                className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1877F2]/40 hover:shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2]">
                  <Facebook className="h-4 w-4 fill-white text-white" />
                </div>

                <span className="text-xs font-semibold text-foreground group-hover:text-[#1877F2]">
                  Facebook
                </span>
              </a>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-2 text-xs font-bold text-success">
            <span className="text-base">💵</span>
            Cash on Delivery
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mx-auto mt-10 max-w-7xl border-t border-border px-4 pt-6 text-center text-xs text-muted-foreground">
        <p className="font-medium">
          Secure Ordering • Cash on Delivery • Delivery Across Pakistan
        </p>

        <p className="mt-2">
          © {new Date().getFullYear()} {siteConfig.brandName}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}