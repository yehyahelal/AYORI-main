import { Link } from "react-router-dom";
import { Sparkles, Mail, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/bear-icon.png" alt="Yadawi Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display text-xl font-bold">
                Yadawi
              </span>
            </Link>
            <p className="text-background/70 text-sm mb-4">
              Handmade plush toys crafted with love for your little ones. Every stitch tells a story.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/yadawi_3/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Button variant="ghost" size="icon" className="hover:bg-background/10 text-background/70 hover:text-background">
                  <Instagram className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-background/70 hover:text-background transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-background/70 hover:text-background transition-colors text-sm">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-background/70 hover:text-background transition-colors text-sm">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-background/70 text-sm">Shipping Info</span>
              </li>
              <li>
                <span className="text-background/70 text-sm">Returns & Exchanges</span>
              </li>
              <li>
                <span className="text-background/70 text-sm">Contact Us</span>
              </li>
              <li>
                <span className="text-background/70 text-sm">FAQ</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-background/70 text-sm mb-4">
              Subscribe for new arrivals and special offers!
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50"
              />
              <Button variant="hero" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} Yadawi. Made with ❤️ for little dreamers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};
