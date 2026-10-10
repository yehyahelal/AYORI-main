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
  const currency = "$";

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    await createCheckout();
    const url = useCartStore.getState().checkoutUrl;
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some cuddly friends to get started!</p>
              <Link to="/products"><Button variant="hero">Browse Products</Button></Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-card rounded-2xl p-4 shadow-soft flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 && (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{item.product.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.category || "Product"}</p>
                      <p className="font-bold text-primary mt-1">{currency} {Number(item.product.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)}><Trash2 className="w-4 h-4" /></Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-3xl p-6 shadow-card h-fit sticky top-24">
                <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
                <div className="flex justify-between mb-4"><span>Subtotal</span><span className="font-bold">{currency} {totalPrice.toFixed(2)}</span></div>
                <Button variant="hero" className="w-full" size="lg" onClick={handleCheckout} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Checkout"}
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
