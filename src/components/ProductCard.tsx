import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/products";
import { useCartStore, useWishlistStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      product,
      quantity: 1,
    });
    toast.success("Added to cart!", {
      description: `${product.title} has been added to your cart.`,
      position: "top-center",
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist", { position: "top-center" });
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist!", {
        description: `${product.title} has been saved.`,
        position: "top-center",
      });
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-border/40">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-4xl sm:text-6xl">🧸</span>
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card"
                onClick={handleToggleWishlist}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-coral text-coral" : ""}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Wishlist Badge */}
          {isWishlisted && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-coral flex items-center justify-center shadow-sm">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-card text-card" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-4 md:p-5">
          <h3 className="font-display text-xs sm:text-base md:text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm mt-0.5 line-clamp-1 sm:line-clamp-2">
            {product.description || "Handmade with love ❤️"}
          </p>

          <div className="flex items-center justify-between gap-1 mt-2 sm:mt-3">
            <span className="font-display text-xs sm:text-base md:text-lg font-bold text-primary truncate">
              EGP {Number(product.price).toFixed(2)}
            </span>
            <Button
              size="sm"
              variant={product.inventory_count === 0 ? "secondary" : "default"}
              onClick={handleAddToCart}
              className="rounded-full h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs shrink-0"
              disabled={product.inventory_count === 0}
            >
              {product.inventory_count === 0 ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
