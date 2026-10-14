import { Link } from "react-router-dom";
import { Sparkles, Mail, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
                <img src="/bear-icon.png" alt="Yadawi Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold">
                Yadawi
              </span>
            </Link>
            <p className="text-background/70 text-xs sm:text-sm mb-3 max-w-sm">
              Handmade plush toys crafted with love for your little ones. Every stitch tells a story.
            </p>
            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/yadawi_3/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-background/10 text-background/70 hover:text-background">
                  <Instagram className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="font-display text-sm sm:text-base font-semibold mb-2 sm:mb-3">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/products" className="text-background/70 hover:text-background transition-colors text-xs sm:text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-background/70 hover:text-background transition-colors text-xs sm:text-sm">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-background/70 hover:text-background transition-colors text-xs sm:text-sm">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="font-display text-sm sm:text-base font-semibold mb-2 sm:mb-3">Support</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <span className="text-background/70 text-xs sm:text-sm">Shipping Info</span>
              </li>
              <li>
                <span className="text-background/70 text-xs sm:text-sm">Returns & Exchanges</span>
              </li>
              <li>
                <span className="text-background/70 text-xs sm:text-sm">Contact Us</span>
              </li>
              <li>
                <span className="text-background/70 text-xs sm:text-sm">FAQ</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-sm sm:text-base font-semibold mb-2 sm:mb-3">Stay Updated</h3>
            <p className="text-background/70 text-xs sm:text-sm mb-3">
              Subscribe for new arrivals and special offers!
            </p>
            <div className="flex gap-2 max-w-sm">
              <Input
                type="email"
                placeholder="Your email"
                className="h-9 text-xs sm:text-sm bg-background/10 border-background/20 text-background placeholder:text-background/50 rounded-xl"
              />
              <Button variant="hero" size="icon" className="h-9 w-9 shrink-0 rounded-xl">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-6 sm:mt-12 sm:pt-8 text-center">
          <p className="text-background/50 text-[11px] sm:text-xs">
            © {new Date().getFullYear()} Yadawi. Made with ❤️ for little dreamers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};
