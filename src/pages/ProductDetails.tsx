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
            <main className="flex-1 py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                                <DialogTrigger asChild>
                                    <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative group cursor-zoom-in">
                                        {currentImageUrl ? (
                                            <img
                                                src={currentImageUrl}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                No image available
                                            </div>
                                        )}

                                        {/* Wishlist Button - Prevent triggering lightbox */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white text-destructive hover:text-destructive z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist();
                                            }}
                                        >
                                            <Heart className={`w-6 h-6 ${isWishlisted ? "fill-current" : ""}`} />
                                        </Button>

                                        {/* Zoom Hint */}
                                        <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Maximize2 className="w-5 h-5" />
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
                                <div className="flex gap-4 overflow-auto pb-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                                                selectedImageIndex === index ? "border-primary" : "border-transparent hover:border-primary/50"
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
                        <div className="space-y-8">
                            <div>
                                <Badge variant="secondary" className="mb-4">{category || "Product"}</Badge>
                                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">{title}</h1>
                                <p className="text-3xl font-bold text-primary">
                                    EGP {Number(price).toFixed(2)}
                                </p>
                            </div>

                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                                <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium">Quantity:</span>
                                    <div className="flex items-center gap-2 border rounded-full p-1 bg-card">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-8 w-8"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={product.inventory_count === 0}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="w-8 text-center font-bold">{quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-8 w-8"
                                            onClick={() => setQuantity(Math.min(product.inventory_count || 0, quantity + 1))}
                                            disabled={product.inventory_count === 0 || quantity >= (product.inventory_count || 0)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {product.inventory_count === 0 && (
                                        <span className="text-sm text-destructive font-semibold">Out of Stock</span>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button 
                                        variant={product.inventory_count === 0 ? "secondary" : "hero"} 
                                        size="lg" 
                                        className="flex-1 text-lg h-14" 
                                        onClick={handleAddToCart}
                                        disabled={product.inventory_count === 0}
                                    >
                                        <ShoppingCart className="w-5 h-5 mr-2" />
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
