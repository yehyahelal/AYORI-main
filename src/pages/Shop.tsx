import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductGrid } from "@/components/ProductGrid";

const Shop = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <div className="bg-primary/5 py-6 sm:py-10 md:py-16 mb-4 sm:mb-6">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">All Products</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
                            Browse our complete collection of handmade plush toys. Find your perfect cuddle buddy today!
                        </p>
                    </div>
                </div>

                <div className="pb-8 sm:pb-16">
                    <ProductGrid />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Shop;
