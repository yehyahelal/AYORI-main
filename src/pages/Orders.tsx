import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Loader2, 
  Package, 
  Eye, 
  Search, 
  Copy, 
  Check, 
  X, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatOrderNumber, orderMatchesQuery, cleanOrderSearch } from '@/lib/orderUtils';
import { OrderStatusSelect } from '@/components/OrderStatusSelect';
import { ReturnConditionModal } from '@/components/ReturnConditionModal';
import { CancelOrderModal } from '@/components/CancelOrderModal';
import { CloseOrderModal } from '@/components/CloseOrderModal';
import { AdminEmailSettingsModal } from '@/components/AdminEmailSettingsModal';
import { 
  getOrderStockItems, 
  restockOrderInventory, 
  deductOrderInventory, 
  type OrderItemStockInfo 
} from '@/lib/stockUtils';

export default function Orders() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Return & Cancel Stock Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [activeStockOrder, setActiveStockOrder] = useState<any | null>(null);
  const [modalStockItems, setModalStockItems] = useState<OrderItemStockInfo[]>([]);
  const [isLoadingStockItems, setIsLoadingStockItems] = useState(false);
  const [isSubmittingStockAction, setIsSubmittingStockAction] = useState(false);

  // Close Order Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [activeCloseOrder, setActiveCloseOrder] = useState<any | null>(null);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Quick lookup state for non-authenticated tracking
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // If on admin route and user is definitely not admin (once loaded), redirect
    if (!loading && isAdminRoute && !isAdmin) {
      // Don't bounce immediately if user is regular, we can redirect to /orders
      if (user) {
        navigate('/orders');
      } else {
        navigate('/auth');
      }
    }
  }, [user, isAdmin, loading, isAdminRoute, navigate]);

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [user, isAdmin, loading, isAdminRoute]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      // If user is not admin, filter to only their orders
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setOrders(data);
      } else if (error) {
        console.error('Error fetching orders:', error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleCopy = (text: string, label: string = 'Order ID') => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied ${label} ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyEscalationSnippet = (order: any) => {
    const orderNum = formatOrderNumber(order);
    const snippet = `[ESCALATION] Order ID: ${orderNum} | Customer: ${order.customer_name} | Email: ${order.customer_email} | Phone: ${order.phone_number || 'N/A'} | Status: ${order.status.toUpperCase()} | Total: EGP ${Number(order.total_amount).toFixed(2)}`;
    navigator.clipboard.writeText(snippet);
    toast.success(`Copied full escalation details for ${orderNum}!`);
  };

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
    
    // Fetch items
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(title, images, price)')
      .eq('order_id', order.id);
      
    if (!error && data) {
      setOrderItems(data);
    }
  };

  // Status Change Interceptor: handles cancellation, returns, and closed lock rules
  const handleStatusChangeRequest = async (order: any, newStatus: string) => {
    // If order is closed, status change is strictly forbidden
    if (order.is_closed) {
      toast.error('This order is closed and permanently locked. Status cannot be modified.');
      return;
    }

    if (order.status === newStatus) return;

    // 1. Returned: must ask if item is damaged first
    if (newStatus === 'returned') {
      setActiveStockOrder(order);
      setModalStockItems([]);
      setIsLoadingStockItems(true);
      setReturnModalOpen(true);
      const items = await getOrderStockItems(order.id);
      setModalStockItems(items);
      setIsLoadingStockItems(false);
      return;
    }

    // 2. Cancelled: confirm and restock into inventory
    if (newStatus === 'cancelled') {
      setActiveStockOrder(order);
      setModalStockItems([]);
      setIsLoadingStockItems(true);
      setCancelModalOpen(true);
      const items = await getOrderStockItems(order.id);
      setModalStockItems(items);
      setIsLoadingStockItems(false);
      return;
    }

    // 3. Reactivating a previously restocked order (e.g. from cancelled/returned back to processing/shipped)
    if (order.restocked) {
      const { count } = await deductOrderInventory(order.id);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, restocked: false })
        .eq('id', order.id);

      if (error) {
        toast.error('Failed to update status');
        return;
      }

      toast.success(`Order reactivated to ${newStatus}. Re-deducted ${count} items from inventory.`);
      const updated = { ...order, status: newStatus, restocked: false };
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(updated);
      }
      return;
    }

    // 4. Standard direct status update
    await executeDirectStatusUpdate(order.id, newStatus);
  };

  const executeDirectStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  // Confirm Return: Damaged vs Good Condition
  const handleConfirmReturn = async (isDamaged: boolean) => {
    if (!activeStockOrder) return;
    setIsSubmittingStockAction(true);
    try {
      let restockedCount = 0;
      if (!isDamaged) {
        // Not damaged: return to stock and increase quantity
        const result = await restockOrderInventory(activeStockOrder.id);
        restockedCount = result.count;
      }

      // Update order status in DB
      const updatePayload: any = {
        status: 'returned',
        is_damaged: isDamaged,
        restocked: !isDamaged
      };

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', activeStockOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = {
        ...activeStockOrder,
        status: 'returned',
        is_damaged: isDamaged,
        restocked: !isDamaged
      };
      setOrders(prev => prev.map(o => o.id === activeStockOrder.id ? { ...o, ...updatedOrder } : o));
      if (selectedOrder && selectedOrder.id === activeStockOrder.id) {
        setSelectedOrder((prev: any) => prev ? { ...prev, ...updatedOrder } : null);
      }

      if (isDamaged) {
        toast.success(`Order ${formatOrderNumber(activeStockOrder)} marked as Returned. Items marked damaged (stock not increased).`);
      } else {
        toast.success(`Order ${formatOrderNumber(activeStockOrder)} marked as Returned. Restocked +${restockedCount} plushies to inventory!`);
      }
      setReturnModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update return status');
    } finally {
      setIsSubmittingStockAction(false);
    }
  };

  // Confirm Cancellation: Restock all items to inventory
  const handleConfirmCancel = async () => {
    if (!activeStockOrder) return;
    setIsSubmittingStockAction(true);
    try {
      // Restock items into inventory
      const result = await restockOrderInventory(activeStockOrder.id);

      // Update order status in DB
      const updatePayload: any = {
        status: 'cancelled',
        restocked: true
      };

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', activeStockOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = {
        ...activeStockOrder,
        status: 'cancelled',
        restocked: true
      };
      setOrders(prev => prev.map(o => o.id === activeStockOrder.id ? { ...o, ...updatedOrder } : o));
      if (selectedOrder && selectedOrder.id === activeStockOrder.id) {
        setSelectedOrder((prev: any) => prev ? { ...prev, ...updatedOrder } : null);
      }

      toast.success(`Order ${formatOrderNumber(activeStockOrder)} cancelled. Restocked +${result.count} plushies back to inventory!`);
      setCancelModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setIsSubmittingStockAction(false);
    }
  };

  // Close Order Request & Confirm Handlers (Permanent & Irreversible from Website)
  const handleRequestCloseOrder = (order: any) => {
    setActiveCloseOrder(order);
    setCloseModalOpen(true);
  };

  const handleConfirmCloseOrder = async () => {
    if (!activeCloseOrder) return;
    setIsSubmittingClose(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('orders')
        .update({
          is_closed: true,
          closed_at: now
        } as any)
        .eq('id', activeCloseOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = {
        ...activeCloseOrder,
        is_closed: true,
        closed_at: now
      };
      setOrders(prev => prev.map(o => o.id === activeCloseOrder.id ? { ...o, ...updatedOrder } : o));
      if (selectedOrder && selectedOrder.id === activeCloseOrder.id) {
        setSelectedOrder((prev: any) => prev ? { ...prev, ...updatedOrder } : null);
      }

      toast.success(`Order ${formatOrderNumber(activeCloseOrder)} has been permanently closed & locked.`);
      setCloseModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to close order');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Direct single order lookup for customers/guests
  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsLookingUp(true);
    const cleaned = lookupQuery.trim();
    const formattedWithHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.eq.${formattedWithHash},order_number.eq.${cleaned},id.eq.${cleaned}`)
        .maybeSingle();

      if (error || !data) {
        toast.error(`No order found matching "${lookupQuery}". Please verify the Order ID (e.g. #123456).`);
      } else {
        toast.success(`Found order ${formatOrderNumber(data)}!`);
        handleViewOrder(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to look up order');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Filtered orders list based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search Query Filter
      if (searchQuery.trim() && !orderMatchesQuery(order, searchQuery)) {
        return false;
      }
      // 2. Status Filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 capitalize font-medium">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize font-medium">Shipped</Badge>;
      case 'processing':
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 capitalize font-medium">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 capitalize font-medium">Cancelled</Badge>;
      case 'returned':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize font-medium">Returned</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize font-medium">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If visitor is not logged in and not admin
  const isGuest = !user;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {isAdmin ? (isAdminRoute ? 'Admin Orders Dashboard' : 'Orders Management') : 'My Orders'}
              </h1>
              {isAdmin && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                  Admin Access
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isAdmin 
                ? 'Search, manage, and escalate customer orders by unique Order ID (#123456).'
                : 'Track your plushie orders and check status using your unique Order ID (#123456).'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEmailModalOpen(true)}
                  className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-foreground"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Email Alerts
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  Manage Products
                </Button>
              </>
            )}
            <Button variant="playful" size="sm" onClick={() => navigate('/products')}>
              Shop Plushies
            </Button>
          </div>
        </div>

        {/* Quick Search / Tracking Banner for Escalations */}
        <Card className="rounded-2xl border-border/60 shadow-sm mb-6 bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-auto flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="text"
                    placeholder="Search by Order ID (e.g. #123456), Customer Name, Email, or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-9 h-11 rounded-xl bg-background border-border/80 text-sm focus-visible:ring-primary"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => {
                  const count = statusCounts[status] || 0;
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {searchQuery && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                <span>
                  Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} matching "{searchQuery}"
                </span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-primary hover:underline font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guest Order Lookup Helper (If user is not logged in) */}
        {isGuest && (
          <Card className="rounded-2xl border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm mb-6 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Have an Order ID (#123456)?</h3>
                  <p className="text-xs text-muted-foreground">
                    You can look up any order status directly by entering your unique order number below.
                  </p>
                </div>
              </div>
              <form onSubmit={handleQuickLookup} className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="e.g. #123456"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="font-mono h-9 w-36 bg-white dark:bg-card"
                />
                <Button size="sm" type="submit" variant="hero" disabled={isLookingUp}>
                  {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track Order'}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Orders Table Card */}
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
          <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {isAdmin ? 'All Customer Orders' : 'Your Orders'}
              <Badge variant="secondary" className="ml-2 font-mono text-xs">
                {filteredOrders.length}
              </Badge>
            </CardTitle>

            <span className="text-xs text-muted-foreground">
              Tip: Click any <span className="font-mono font-bold text-foreground">#ID</span> to copy it
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading orders list...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Order ID</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Customer</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Contact</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Total</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const orderNumber = formatOrderNumber(order);
                      const isThisCopied = copiedId === orderNumber;

                      return (
                        <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                          {/* Order ID column formatted as #123456 */}
                          <TableCell className="pl-6 font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => handleViewOrder(order)}
                                className="text-primary hover:underline cursor-pointer text-sm"
                                title="Click to view details"
                              >
                                {orderNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(orderNumber)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy Order ID"
                              >
                                {isThisCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>

                          {/* Customer */}
                          <TableCell className="font-semibold text-sm">
                            {order.customer_name}
                          </TableCell>

                          {/* Contact */}
                          <TableCell className="text-xs text-muted-foreground">
                            <div>{order.customer_email}</div>
                            {order.phone_number && (
                              <div className="font-mono text-[11px] text-muted-foreground/80">{order.phone_number}</div>
                            )}
                          </TableCell>

                          {/* Total */}
                          <TableCell className="font-bold text-sm text-foreground whitespace-nowrap">
                            EGP {Number(order.total_amount).toFixed(2)}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <OrderStatusSelect
                              status={order.status}
                              onStatusChange={isAdmin ? (newStatus) => handleStatusChangeRequest(order, newStatus) : undefined}
                              disabled={!isAdmin || Boolean(order.is_closed)}
                              isClosed={Boolean(order.is_closed)}
                            />
                          </TableCell>

                          {/* Action */}
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewOrder(order)}
                                className="h-7 px-2.5 gap-1 font-semibold text-xs text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>

                              {isAdmin && (
                                order.is_closed ? (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 select-none"
                                    title="Order is closed and locked"
                                  >
                                    <Lock className="w-3 h-3" /> Closed
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRequestCloseOrder(order)}
                                    className="h-7 px-2 text-[11px] gap-1 text-slate-600 hover:text-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                                    title="Close and permanently lock this order"
                                  >
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    Close
                                  </Button>
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  {searchQuery ? 'No matching orders found' : 'No orders found'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  {searchQuery 
                    ? `We couldn't find any orders matching "${searchQuery}". Check the Order ID (e.g. #123456) and try again.`
                    : 'When customer orders are placed, they will appear here with unique #123456 IDs.'
                  }
                </p>
                {searchQuery ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Reset Search
                  </Button>
                ) : (
                  <Button variant="hero" size="sm" onClick={() => navigate('/products')}>
                    Browse Shop
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Order Details & Escalation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="pb-2 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
                  <span>Order</span>
                  <span className="font-mono text-primary">
                    {selectedOrder ? formatOrderNumber(selectedOrder) : ''}
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>

              {selectedOrder && (
                <div className="flex items-center gap-2">
                  <OrderStatusSelect
                    status={selectedOrder.status}
                    onStatusChange={isAdmin ? (newStatus) => handleStatusChangeRequest(selectedOrder, newStatus) : undefined}
                    disabled={!isAdmin || Boolean(selectedOrder.is_closed)}
                    isClosed={Boolean(selectedOrder.is_closed)}
                  />
                  {selectedOrder.is_closed && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-300 dark:border-slate-700 select-none">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 font-mono"
                    onClick={() => handleCopy(formatOrderNumber(selectedOrder))}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy ID
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Escalation Reference Box */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                      Escalation Reference
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Use Order ID <strong className="font-mono">{formatOrderNumber(selectedOrder)}</strong> to track with courier or handle escalation.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold whitespace-nowrap bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100"
                  onClick={() => handleCopyEscalationSnippet(selectedOrder)}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Escalation Note
                </Button>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Customer Name</p>
                  <p className="font-semibold text-foreground text-base mt-0.5">{selectedOrder.customer_name}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Contact Email</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <a href={`mailto:${selectedOrder.customer_email}`} className="font-medium text-primary hover:underline">
                      {selectedOrder.customer_email}
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedOrder.phone_number ? (
                      <a href={`tel:${selectedOrder.phone_number}`} className="font-medium font-mono text-primary hover:underline">
                        {selectedOrder.phone_number}
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Order Status</p>
                  <OrderStatusSelect
                    status={selectedOrder.status}
                    onStatusChange={isAdmin ? (newStatus) => handleStatusChangeRequest(selectedOrder, newStatus) : undefined}
                    disabled={!isAdmin || Boolean(selectedOrder.is_closed)}
                    isClosed={Boolean(selectedOrder.is_closed)}
                    size="md"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Shipping Address</p>
                  <p className="font-medium text-foreground mt-0.5 whitespace-pre-line flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{selectedOrder.shipping_address}</span>
                  </p>
                </div>
              </div>

              {/* Items Ordered */}
              <div>
                <h3 className="font-semibold text-base mb-3 flex items-center justify-between">
                  <span>Items in Order</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {orderItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} items total
                  </span>
                </h3>
                
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center bg-card p-3 rounded-xl border border-border/50">
                        <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                          {item.products?.images?.[0] ? (
                            <img src={item.products.images[0]} alt="Product" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.products?.title || 'Plush Toy'}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-sm text-right">
                          EGP {(Number(item.price_at_time) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">Loading order items...</p>
                  )}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-lg">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-bold text-primary text-xl">
                    EGP {Number(selectedOrder.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Modal footer links */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
                {isAdmin && !selectedOrder.is_closed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestCloseOrder(selectedOrder)}
                    className="w-full sm:w-auto text-xs gap-1 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Close Order
                  </Button>
                )}
                <Link to={`/order-confirmation/${selectedOrder.id}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View receipt
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Assessment Modal (asks if returned item is damaged) */}
      <ReturnConditionModal
        open={returnModalOpen}
        onOpenChange={setReturnModalOpen}
        order={activeStockOrder}
        items={modalStockItems}
        isLoadingItems={isLoadingStockItems}
        isSubmitting={isSubmittingStockAction}
        onConfirm={handleConfirmReturn}
      />

      {/* Cancel Order Modal (restocks inventory) */}
      <CancelOrderModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        order={activeStockOrder}
        items={modalStockItems}
        isLoadingItems={isLoadingStockItems}
        isSubmitting={isSubmittingStockAction}
        onConfirm={handleConfirmCancel}
      />

      {/* Permanent Close Order Modal */}
      <CloseOrderModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        order={activeCloseOrder}
        isSubmitting={isSubmittingClose}
        onConfirm={handleConfirmCloseOrder}
      />

      {/* Admin Email Notification Settings Modal */}
      <AdminEmailSettingsModal
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
      />

      <Footer />
    </div>
  );
}
