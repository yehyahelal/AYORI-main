import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateOrderNumber, formatOrderNumber } from "@/lib/orderUtils";
import { sendOrderNotificationEmail } from "@/lib/emailService";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.display_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: ""
  });

  useEffect(() => {
    // Fetch delivery fee
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'delivery_fee').single();
      if (data) {
        setDeliveryFee(Number(data.value));
      }
    };
    fetchSettings();
  }, []);

  const itemsTotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const totalPrice = itemsTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/products')}>Go to Shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to checkout");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = formData.city ? `${formData.address}, ${formData.city}` : formData.address;
      const uniqueOrderNumber = generateOrderNumber();

      // 1. Create the order
      let order: any = null;

      const primaryAttempt = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: uniqueOrderNumber,
          customer_name: formData.name,
          customer_email: formData.email,
          shipping_address: fullAddress,
          phone_number: formData.phone,
          total_amount: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (primaryAttempt.error) {
        // If order_number column doesn't exist in Supabase yet, retry without it
        if (
          primaryAttempt.error.message?.includes('order_number') ||
          primaryAttempt.error.code === 'PGRST204' ||
          primaryAttempt.error.details?.includes('order_number')
        ) {
          console.warn("order_number column missing in DB, falling back:", primaryAttempt.error);
          const fallbackAttempt = await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              customer_name: formData.name,
              customer_email: formData.email,
              shipping_address: fullAddress,
              phone_number: formData.phone,
              total_amount: totalPrice,
              status: 'pending'
            })
            .select()
            .single();

          if (fallbackAttempt.error) throw fallbackAttempt.error;
          order = fallbackAttempt.data;
          order.order_number = uniqueOrderNumber;
        } else {
          throw primaryAttempt.error;
        }
      } else {
        order = primaryAttempt.data;
      }

      // 2. Create order items (Trigger handles inventory!)
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price_at_time: item.product.price
          });
        
        if (itemError) throw itemError;
      }

      const displayId = formatOrderNumber(order);
      toast.success(`Order ${displayId} placed successfully!`);
      const orderedItemsSnapshot = [...items];

      // 3. Dispatch automated email notification to Admin (non-blocking)
      sendOrderNotificationEmail({
        order: { ...order, order_number: order.order_number || uniqueOrderNumber },
        items: orderedItemsSnapshot,
        deliveryFee,
        totalPrice
      }).catch((emailErr) => {
        console.warn("Background order email notification error:", emailErr);
      });

      clearCart();
      navigate(`/order-confirmation/${order.id}`, {
        state: {
          order: { ...order, order_number: order.order_number || uniqueOrderNumber },
          items: orderedItemsSnapshot,
          deliveryFee,
          totalPrice
        }
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-semibold mb-6">Shipping Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" required value={formData.address} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required value={formData.city} onChange={handleChange} placeholder="e.g. Cairo" />
                </div>
                <Button type="submit" className="w-full mt-8" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : `Place Order (EGP ${totalPrice.toFixed(2)})`}
                </Button>
              </form>
            </div>

            <div>
              <div className="bg-card rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                <div className="space-y-4 max-h-[40vh] overflow-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {item.product.images && item.product.images[0] && (
                          <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.title}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-bold">EGP {(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Subtotal</span>
                    <span>EGP {itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>EGP {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">EGP {totalPrice.toFixed(2)}</span>
                  </div>
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

export default Checkout;
