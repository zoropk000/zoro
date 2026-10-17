import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Instagram,
  Facebook,
  MessageCircle,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
export function Footer() {
  return (
    <footer className="store-footer">
      <div className="footer-benefits store-container">
        {[
          { icon: Truck, title: "Across Pakistan", text: "Delivered to your doorstep" },
          { icon: ShieldCheck, title: "Shop with confidence", text: "Cash on delivery available" },
          { icon: RefreshCw, title: "Here to help", text: "Simple exchange support" },
          { icon: Headphones, title: "A real conversation", text: "Support on WhatsApp" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon size={25} strokeWidth={1.4} />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="footer-main">
        <div className="store-container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand-wordmark">
              ZORO<span>PK</span>
            </Link>
            <p>
              Good style. Great finds.
              <br />A little more you, every day.
            </p>
            <div className="footer-social">
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="ZORO Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href={siteConfig.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="ZORO Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="ZORO WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
          <div>
            <h3>Explore ZORO</h3>
            {["Clothing", "Shoes", "Perfumes", "Accessories"].map((c) => (
              <a key={c} href={`/shop?category=${c.toLowerCase()}`}>
                {c}
              </a>
            ))}
            <a href="/shop?collection=new">New arrivals</a>
            <Link to="/sale">The sale edit</Link>
          </div>
          <div>
            <h3>Let us help</h3>
            <Link to="/contact">Contact us</Link>
            <Link to="/track-order">Track your order</Link>
            <Link to="/delivery">Shipping & delivery</Link>
            <Link to="/returns">Returns & exchanges</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/account">My account</Link>
          </div>
          <div className="footer-contact">
            <h3>We’re just a message away.</h3>
            <p>
              Need a hand finding your favourite?
              <br />
              Our team is happy to help.
            </p>
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="footer-whatsapp"
            >
              Let’s talk on WhatsApp <ArrowUpRight size={17} />
            </a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
            <small>{siteConfig.address}</small>
          </div>
        </div>
        <div className="store-container footer-bottom">
          <span>© {new Date().getFullYear()} ZORO. All rights reserved.</span>
          <div>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
            <Link to="/about">Our story</Link>
          </div>
          <span className="payment-label">
            CASH ON DELIVERY <i /> EASYPAISA <i /> BANK TRANSFER
          </span>
        </div>
      </div>
    </footer>
  );
}
