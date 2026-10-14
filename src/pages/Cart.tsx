import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Cart = () => {
  const { items, updateQuantity, removeItem, isLoading, createCheckout } = useCartStore();
  const totalPrice = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const currency = "EGP";

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-4 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-12 sm:py-20 bg-muted/30 rounded-2xl sm:rounded-3xl p-4">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h2 className="font-display text-lg sm:text-2xl font-semibold mb-1 sm:mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Add some cuddly friends to get started!</p>
              <Link to="/products"><Button variant="hero" size="sm" className="h-10 text-xs sm:text-sm">Browse Products</Button></Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-soft flex items-center gap-3 sm:gap-4 border border-border/40">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 && (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xs sm:text-base font-semibold truncate">{item.product.title}</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">{item.product.category || "Product"}</p>
                      <p className="font-bold text-primary text-xs sm:text-sm mt-0.5">{currency} {Number(item.product.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/40 rounded-lg p-0.5 border border-border/40">
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-md" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 sm:w-7 text-center font-bold text-xs sm:text-sm">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 sm:h-7 sm:w-7 rounded-md" 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product.inventory_count || 0)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card h-fit sticky top-20 sm:top-24 border border-border/40">
                <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Order Summary</h2>
                <div className="flex justify-between items-center mb-4 text-sm sm:text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-primary">{currency} {totalPrice.toFixed(2)}</span>
                </div>
                <Button variant="hero" className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" size="default" onClick={handleCheckout} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Proceed to Checkout"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
