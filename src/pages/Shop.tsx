import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductGrid } from "@/components/ProductGrid";

const Shop = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <div className="bg-primary/5 py-12 md:py-20 mb-8">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">All Products</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Browse our complete collection of handmade plush toys. Find your perfect cuddle buddy today!
                        </p>
                    </div>
                </div>

                {/* We can reuse the ProductGrid but hide the header "Our Cuddly Collection" logic if we want, 
            or just let it be. For now, reusing it as is is fine, but wrapping it to avoid duplication. */}
                <div className="pb-16">
                    <ProductGrid />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Shop;
