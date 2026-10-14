import { useEffect, useState } from "react";
import { Product, fetchProducts } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

export const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts(8);
        setProducts(data);
      } catch (err) {
        setError("Failed to load products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-14 md:py-20">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
              Our Cuddly Collection
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              Handpicked plush friends waiting for a new home
            </p>
          </div>
          <Link to="/products" className="shrink-0 ml-2">
            <Button variant="outline" size="sm" className="group h-8 sm:h-9 px-3 text-xs sm:text-sm">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-muted/30 rounded-2xl sm:rounded-3xl p-4">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🧸</div>
            <h3 className="font-display text-lg sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              We're adding new cuddly friends soon! Tell us what toys you'd like to see.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
