import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Package, 
  Truck, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Printer, 
  ArrowRight, 
  HelpCircle, 
  MessageCircle, 
  Search,
  ShoppingBag,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatOrderNumber } from "@/lib/orderUtils";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(location.state?.order || null);
  const [items, setItems] = useState<any[]>(location.state?.items || []);
  const [isLoading, setIsLoading] = useState(!order);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!order && orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId, order]);

  const fetchOrderDetails = async (id: string) => {
    setIsLoading(true);
    try {
      // First try to fetch by UUID or order_number
      let query = supabase.from("orders").select("*");
      if (id.startsWith("#")) {
        query = query.eq("order_number", id);
      } else if (id.length > 20) {
        query = query.eq("id", id);
      } else {
        // Could be order number without #
        query = query.or(`order_number.eq.#${id},order_number.eq.${id},id.eq.${id}`);
      }

      const { data: orderData, error: orderErr } = await query.maybeSingle();

      if (orderErr || !orderData) {
        console.error("Order not found:", orderErr);
        setIsLoading(false);
        return;
      }

      setOrder(orderData);

      // Fetch items for this order
      const { data: itemsData, error: itemsErr } = await supabase
        .from("order_items")
        .select("*, products(title, images, price)")
        .eq("order_id", orderData.id);

      if (!itemsErr && itemsData) {
        const formattedItems = itemsData.map((item: any) => ({
          product: {
            id: item.product_id,
            title: item.products?.title || "Plush Toy",
            images: item.products?.images || [],
            price: item.price_at_time,
          },
          quantity: item.quantity,
        }));
        setItems(formattedItems);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const orderNumberDisplay = formatOrderNumber(order);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderNumberDisplay);
    setHasCopied(true);
    toast.success(`Copied Order ID ${orderNumberDisplay} to clipboard!`);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading order confirmation...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn't locate this order. If you have an order number (e.g. #123456), you can search for it in your order list.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate("/orders")} variant="hero">
              <Search className="w-4 h-4 mr-2" /> View Order List
            </Button>
            <Button onClick={() => navigate("/products")} variant="outline">
              Continue Shopping
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * (item.quantity || 1),
    0
  );
  const totalAmount = Number(order.total_amount) || itemsTotal;
  const deliveryFee = Math.max(0, totalAmount - itemsTotal);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      <Navbar />

      <main className="flex-1 py-4 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Shopify-style Success Header */}
          <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-card border border-border/60 mb-6 sm:mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-emerald-400 via-primary to-coral" />
            
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-4 sm:ring-8 ring-emerald-50 dark:ring-emerald-950/30 animate-bounce-soft">
              <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            </div>

            <p className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mb-1">
              Confirmed & Processing
            </p>
            <h1 className="font-display text-2xl sm:text-3.5xl md:text-5xl font-bold text-foreground mb-1.5 sm:mb-2">
              Thank you, {order.customer_name}!
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              Your order is confirmed. A receipt and shipping updates will be sent to{" "}
              <span className="font-semibold text-foreground">{order.customer_email}</span>.
            </p>

            {/* Unique Order ID Showcase Banner (Shopify Style) */}
            <div className="mt-5 sm:mt-8 mx-auto max-w-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/25 rounded-xl sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
                Your Unique Order ID
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
                  {orderNumberDisplay}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyOrderId}
                  className="h-8 px-2.5 sm:px-3 text-xs bg-card hover:bg-primary hover:text-white transition-all shadow-sm font-semibold gap-1"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                Save this ID to search your order in the <Link to="/orders" className="text-primary font-bold underline">Order List</Link> or quote it to support for fast escalation assistance.
              </p>
            </div>
          </div>

          {/* Shopify Order Progress Stepper */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border/60 mb-6 sm:mb-8">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 sm:mb-6">
              Order Progress
            </h2>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 relative">
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1.5 sm:mb-2 font-bold shadow-sm">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-foreground">Confirmed</p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Order placed</p>
              </div>

              <div className="text-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2 font-bold shadow-sm ${
                  order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered'
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-primary/20 text-primary animate-pulse'
                }`}>
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-foreground">Processing</p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Preparing plushies</p>
              </div>

              <div className="text-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2 font-bold ${
                  order.status === 'shipped' || order.status === 'delivered'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-foreground">On the Way</p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Dispatched courier</p>
              </div>

              <div className="text-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2 font-bold ${
                  order.status === 'delivered'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-foreground">Delivered</p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Enjoy your plushie!</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer & Shipping Information */}
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Delivery & Customer Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs font-bold uppercase">Customer</span>
                    <p className="font-semibold text-foreground text-base">{order.customer_name}</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground">Email</span>
                      <p className="font-medium text-foreground">{order.customer_email}</p>
                    </div>
                  </div>

                  {order.phone_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground">Phone</span>
                        <p className="font-medium text-foreground">{order.phone_number}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground font-bold uppercase">Shipping Address</span>
                    <p className="font-medium text-foreground mt-1 whitespace-pre-line">
                      {order.shipping_address}
                    </p>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-center">
                    <div>
                      <span className="text-xs text-muted-foreground">Payment Method</span>
                      <p className="font-semibold text-foreground">Cash on Delivery (COD)</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                      Pay on Delivery
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Escalation & Customer Support Helper */}
              <Card className="rounded-2xl border-border/60 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Need Help or Have an Escalation?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-950 dark:text-amber-300">
                  <p>
                    If you experience any delivery delays, change of address, or need escalation support, quote your Order ID:
                  </p>
                  <div className="flex items-center gap-2 font-mono font-bold text-base bg-amber-100/70 dark:bg-amber-900/40 px-3 py-2 rounded-lg w-fit">
                    <span>{orderNumberDisplay}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopyOrderId}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link to="/orders">
                      <Button size="sm" variant="secondary" className="gap-1.5 font-medium">
                        <Search className="w-3.5 h-3.5" />
                        Search in View Order List
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items & Cost Breakdown */}
            <div>
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    Items Ordered ({items.reduce((s, i) => s + (i.quantity || 1), 0)})
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={handlePrint} className="print:hidden gap-1 text-xs">
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center py-2 border-b border-border/40 last:border-0">
                          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
                            {item.product?.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.product?.title || "Product"}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="font-bold text-sm text-right">
                            EGP {(Number(item.product?.price || 0) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Order items details recorded.</p>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>EGP {itemsTotal.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee</span>
                        <span>EGP {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t text-foreground">
                      <span>Total Paid / Due</span>
                      <span className="text-primary text-xl">EGP {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Navigation Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
                <Button
                  onClick={() => navigate("/products")}
                  variant="hero"
                  className="flex-1 gap-2"
                >
                  Continue Shopping
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => navigate("/orders")}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Package className="w-4 h-4" />
                  View All Orders
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
