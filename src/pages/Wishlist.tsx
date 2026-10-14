import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useWishlistStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";

const Wishlist = () => {
    const { items, clearWishlist } = useWishlistStore();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 py-4 sm:py-8 md:py-12">
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">My Wishlist</h1>
                        {items.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearWishlist} className="text-muted-foreground hover:text-destructive h-8 px-2.5 text-xs sm:text-sm">
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Clear Wishlist
                            </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-12 sm:py-20 bg-muted/30 rounded-2xl sm:rounded-3xl p-4">
                            <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                            <h2 className="font-display text-lg sm:text-2xl font-semibold mb-1 sm:mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Save your favorite cuddly friends here!</p>
                            <Link to="/products"><Button variant="hero" size="sm" className="h-10 text-xs sm:text-sm">Browse Products</Button></Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                            {items.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Wishlist;
