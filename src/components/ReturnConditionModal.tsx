import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Loader2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { formatOrderNumber } from '@/lib/orderUtils';
import type { OrderItemStockInfo } from '@/lib/stockUtils';

interface ReturnConditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  items: OrderItemStockInfo[];
  isLoadingItems: boolean;
  isSubmitting: boolean;
  onConfirm: (isDamaged: boolean) => Promise<void>;
}

export const ReturnConditionModal: React.FC<ReturnConditionModalProps> = ({
  open,
  onOpenChange,
  order,
  items,
  isLoadingItems,
  isSubmitting,
  onConfirm,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<'damaged' | 'good' | null>(null);

  if (!order) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = formatOrderNumber(order);

  const handleAction = async (isDamaged: boolean) => {
    setSelectedCondition(isDamaged ? 'damaged' : 'good');
    await onConfirm(isDamaged);
    setSelectedCondition(null);
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 shadow-card border border-border/80">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center flex-shrink-0 shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
                <span>Return Assessment</span>
                <span className="font-mono text-primary text-xl">{orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Customer: <span className="font-semibold text-foreground">{order.customer_name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-3">
          {/* Main Question Callout */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                  Are the returned items damaged?
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1">
                  Returned products must be inspected before restocking. If damaged, they won't be returned to stock. If in good condition, your stock inventory will be increased.
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary Preview */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Items Being Returned ({totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'})
            </p>
            {isLoadingItems ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading order items...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-semibold text-foreground truncate max-w-[200px]">{item.title}</span>
                    </div>
                    <span className="font-mono font-bold bg-background px-2 py-0.5 rounded-md border">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decision Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Option 1: Damaged */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction(true)}
              className="text-left p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                Yes, Damaged
              </h5>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1 leading-snug">
                Defective or soiled. <strong className="font-semibold">Do NOT increase</strong> stock inventory.
              </p>
              <div className="mt-3 pt-2 border-t border-rose-200/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                {isSubmitting && selectedCondition === 'damaged' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <>Mark Damaged (No Stock)</>
                )}
              </div>
            </button>

            {/* Option 2: Good Condition */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction(false)}
              className="text-left p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                No, Good Condition
              </h5>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-snug">
                Clean and sellable. <strong className="font-semibold">Increase stock</strong> by +{totalQuantity}.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-200/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                {isSubmitting && selectedCondition === 'good' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Restocking...</>
                ) : (
                  <>Restock (+{totalQuantity} into stock)</>
                )}
              </div>
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground"
            >
              Cancel / Keep Previous Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
