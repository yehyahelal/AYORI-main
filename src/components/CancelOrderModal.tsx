import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  XCircle, 
  RotateCcw, 
  Package, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { formatOrderNumber } from '@/lib/orderUtils';
import type { OrderItemStockInfo } from '@/lib/stockUtils';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  items: OrderItemStockInfo[];
  isLoadingItems: boolean;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  open,
  onOpenChange,
  order,
  items,
  isLoadingItems,
  isSubmitting,
  onConfirm,
}) => {
  if (!order) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = formatOrderNumber(order);

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 shadow-card border border-border/80">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-xs">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
                <span>Cancel Order</span>
                <span className="font-mono text-primary text-xl">{orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Customer: <span className="font-semibold text-foreground">{order.customer_name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Stock Return Alert */}
          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                  Automatic Stock Return
                </h4>
                <p className="text-xs text-rose-900/80 dark:text-rose-300/80 mt-1">
                  Cancelling this order will automatically restore <strong className="font-semibold">+{totalQuantity} plushies</strong> back into your store's inventory.
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary Preview */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Items to be restocked ({totalQuantity} total)
            </p>
            {isLoadingItems ? (
              <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading items...</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/40 p-2 rounded-xl border text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-semibold text-foreground truncate">{item.title}</span>
                    </div>
                    <span className="font-mono font-bold bg-background px-2 py-0.5 rounded-md border text-[11px]">
                      +{item.quantity} to stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Keep Order Active
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="text-xs gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Restocking & Cancelling...</>
              ) : (
                <><RotateCcw className="w-3.5 h-3.5" /> Cancel & Return to Stock</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
