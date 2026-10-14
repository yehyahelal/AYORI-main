import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductById, Product } from "@/lib/products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCartStore, useWishlistStore } from "@/stores/cartStore";
import { Heart, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, X } from "lucide-react";


const ProductDetails = () => {
    const { handle } = useParams<{ handle: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);


    const { addItem } = useCartStore();
    const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();

    useEffect(() => {
        const loadProduct = async () => {
            if (!handle) return;
            try {
                setLoading(true);
                const data = await fetchProductById(handle);
                setProduct(data);
                setSelectedImageIndex(0);
            } catch (error) {
                console.error("Failed to load product", error);
                toast.error("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [handle]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold">Product not found</h1>
                    <Link to="/products">
                        <Button>Back to Shop</Button>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const { id, title, description, price, images, category } = product;
    const isWishlisted = isInWishlist(id);
    const hasImages = images && images.length > 0;
    const currentImageUrl = hasImages ? images[selectedImageIndex] : null;

    const handleAddToCart = () => {
        addItem({
            product,
            quantity: quantity,
        });
        toast.success("Added to cart!");
    };

    const toggleWishlist = () => {
        if (isWishlisted) {
            removeFromWishlist(id);
            toast.info("Removed from wishlist");
        } else {
            addToWishlist(product);
            toast.success("Added to wishlist");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 py-4 sm:py-8 md:py-12">
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                        {/* Image Gallery */}
                        <div className="space-y-3 sm:space-y-4">
                            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                                <DialogTrigger asChild>
                                    <div className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-muted relative group cursor-zoom-in border border-border/40">
                                        {currentImageUrl ? (
                                            <img
                                                src={currentImageUrl}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl sm:text-6xl">
                                                🧸
                                            </div>
                                        )}

                                        {/* Wishlist Button - Prevent triggering lightbox */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 h-8 w-8 sm:h-9 sm:w-9 bg-white/80 backdrop-blur-sm hover:bg-white text-destructive hover:text-destructive z-10 rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist();
                                            }}
                                        >
                                            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? "fill-current" : ""}`} />
                                        </Button>

                                        {/* Zoom Hint */}
                                        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/50 text-white p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-0 flex items-center justify-center bg-transparent border-none shadow-none [&>button]:text-white [&>button]:bg-black/50 [&>button]:p-2 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
                                    {currentImageUrl && (
                                        <div className="relative w-full h-full flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
                                            <img
                                                src={currentImageUrl}
                                                alt={title}
                                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                                            />
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>

                            {/* Thumbnail Gallery */}
                            {hasImages && images.length > 1 && (
                                <div className="flex gap-2 sm:gap-3 overflow-auto pb-1 custom-scrollbar">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`relative flex-shrink-0 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${
                                                selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"
                                            }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${title} thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-4 sm:space-y-6 md:space-y-8">
                            <div>
                                <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">{category || "Product"}</Badge>
                                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-foreground">{title}</h1>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                                    EGP {Number(price).toFixed(2)}
                                </p>
                            </div>

                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                                <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">{description}</p>
                            </div>

                            <div className="space-y-4 sm:space-y-6 pt-2">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="font-medium text-xs sm:text-sm">Quantity:</span>
                                    <div className="flex items-center gap-1.5 sm:gap-2 border rounded-full p-1 bg-card">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-7 w-7 sm:h-8 sm:w-8"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={product.inventory_count === 0}
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </Button>
                                        <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm">{quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-7 w-7 sm:h-8 sm:w-8"
                                            onClick={() => setQuantity(Math.min(product.inventory_count || 0, quantity + 1))}
                                            disabled={product.inventory_count === 0 || quantity >= (product.inventory_count || 0)}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    {product.inventory_count === 0 && (
                                        <span className="text-xs sm:text-sm text-destructive font-semibold">Out of Stock</span>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button 
                                        variant={product.inventory_count === 0 ? "secondary" : "hero"} 
                                        size="lg" 
                                        className="flex-1 text-sm sm:text-base md:text-lg h-11 sm:h-12 md:h-14 rounded-xl sm:rounded-2xl" 
                                        onClick={handleAddToCart}
                                        disabled={product.inventory_count === 0}
                                    >
                                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        {product.inventory_count === 0 ? "Sold Out" : "Add to Cart"}
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetails;
