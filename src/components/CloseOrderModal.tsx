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
  Lock, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Database,
  CheckCircle2
} from 'lucide-react';
import { formatOrderNumber } from '@/lib/orderUtils';

interface CloseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export const CloseOrderModal: React.FC<CloseOrderModalProps> = ({
  open,
  onOpenChange,
  order,
  isSubmitting,
  onConfirm,
}) => {
  if (!order) return null;

  const orderNumber = formatOrderNumber(order);

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card border border-border/80">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs border border-slate-300 dark:border-slate-700">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
                <span>Close & Lock Order</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Target: <span className="font-mono font-bold text-foreground">{orderNumber}</span> • {order.customer_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Critical Warning Callout */}
          <div className="bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                  Permanent & Irreversible on Website
                </h4>
                <p className="text-xs text-rose-900/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                  Once closed, <strong className="font-semibold underline">no one will be able to change this order's status or reopen it from the website</strong> under any circumstances.
                </p>
              </div>
            </div>
          </div>

          {/* Database Reopen Notice */}
          <div className="bg-muted/40 border border-border/70 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Database className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Database-Only Reopening</p>
              <p className="text-[11px] mt-0.5">
                As per system security rules, this order can only be reopened directly by someone with administrative database access.
              </p>
            </div>
          </div>

          {/* Order Details Snippet */}
          <div className="bg-card rounded-xl p-3 border border-border/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono font-bold">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status</span>
              <span className="font-semibold capitalize text-foreground">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">EGP {Number(order.total_amount).toFixed(2)}</span>
            </div>
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
              Keep Order Open
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="text-xs gap-1.5 font-semibold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isSubmitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Closing Permanently...</>
              ) : (
                <><Lock className="w-3.5 h-3.5" /> Permanently Close Order</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
