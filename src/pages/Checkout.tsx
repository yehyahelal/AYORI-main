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
  const { user, customerSignIn } = useAuth();
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
    if (user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        name: prev.name || user.user_metadata?.display_name || ""
      }));
    }
  }, [user]);

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
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter your email to save your order and purchase history");
      return;
    }

    setIsSubmitting(true);
    try {
      let activeUser = user;

      // If customer is not logged in, auto sign in / register seamlessly in the background
      if (!activeUser) {
        try {
          const { error: authError } = await customerSignIn(cleanEmail, formData.name);
          if (authError) {
            console.warn("Notice during background customer login:", authError.message);
          }
          const { data: sessionData } = await supabase.auth.getSession();
          activeUser = sessionData?.session?.user || null;
        } catch (authErr) {
          console.warn("Silent auth error on checkout:", authErr);
        }
      }

      const fullAddress = formData.city ? `${formData.address}, ${formData.city}` : formData.address;
      const uniqueOrderNumber = generateOrderNumber();

      const isValidUuid = (val?: string | null): boolean => {
        return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      };

      const validUserId = isValidUuid(activeUser?.id) ? activeUser!.id : null;

      // 1. Create the order
      let order: any = null;

      const primaryAttempt = await supabase
        .from('orders')
        .insert({
          user_id: validUserId,
          order_number: uniqueOrderNumber,
          customer_name: formData.name,
          customer_email: cleanEmail,
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
              user_id: validUserId,
              customer_name: formData.name,
              customer_email: cleanEmail,
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
      <main className="flex-1 py-4 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">Checkout</h1>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-6">Shipping Details</h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Full Name</Label>
                  <Input id="name" required value={formData.name} onChange={handleChange} className="h-10 text-sm rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={handleChange} className="h-10 text-sm rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Phone Number</Label>
                  <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} className="h-10 text-sm rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="address" className="text-xs sm:text-sm font-medium">Street Address</Label>
                  <Input id="address" required value={formData.address} onChange={handleChange} className="h-10 text-sm rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="city" className="text-xs sm:text-sm font-medium">City</Label>
                  <Input id="city" required value={formData.city} onChange={handleChange} placeholder="e.g. Cairo" className="h-10 text-sm rounded-xl" />
                </div>
                <Button type="submit" className="w-full mt-6 sm:mt-8 h-11 sm:h-12 text-sm sm:text-base font-semibold" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : `Place Order (EGP ${totalPrice.toFixed(2)})`}
                </Button>
              </form>
            </div>

            <div>
              <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm sticky top-20 sm:top-24 border border-border/40">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-6">Order Summary</h2>
                <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-auto custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {item.product.images && item.product.images[0] && (
                          <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.product.title}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-bold text-xs sm:text-sm text-primary">EGP {(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Subtotal</span>
                    <span>EGP {itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>EGP {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base mt-3 pt-3 border-t">
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
