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
            <main className="flex-1 py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-display text-3xl md:text-4xl font-bold">My Wishlist</h1>
                        {items.length > 0 && (
                            <Button variant="ghost" onClick={clearWishlist} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear Wishlist
                            </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl">
                            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h2 className="font-display text-2xl font-semibold mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-6">Save your favorite cuddly friends here!</p>
                            <Link to="/products"><Button variant="hero">Browse Products</Button></Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
