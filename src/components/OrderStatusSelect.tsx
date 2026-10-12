import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronDown, 
  Check,
  Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

interface StatusConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  dotColor: string;
  badgeStyle: string;
  itemHoverStyle: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    description: 'New order awaiting review',
    icon: Clock,
    dotColor: 'bg-amber-500',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    itemHoverStyle: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/30',
  },
  processing: {
    label: 'Processing',
    description: 'Preparing & packing plushies',
    icon: Package,
    dotColor: 'bg-purple-500',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200/80 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    itemHoverStyle: 'hover:bg-purple-50/80 dark:hover:bg-purple-950/30',
  },
  shipped: {
    label: 'Shipped',
    description: 'Handed over to courier',
    icon: Truck,
    dotColor: 'bg-blue-500',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    itemHoverStyle: 'hover:bg-blue-50/80 dark:hover:bg-blue-950/30',
  },
  delivered: {
    label: 'Delivered',
    description: 'Safely delivered to customer',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-500',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    itemHoverStyle: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30',
  },
  returned: {
    label: 'Returned',
    description: 'Customer requested return',
    icon: RotateCcw,
    dotColor: 'bg-orange-500',
    badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200/80 hover:bg-orange-100/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    itemHoverStyle: 'hover:bg-orange-50/80 dark:hover:bg-orange-950/30',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order voided or cancelled',
    icon: XCircle,
    dotColor: 'bg-rose-500',
    badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    itemHoverStyle: 'hover:bg-rose-50/80 dark:hover:bg-rose-950/30',
  },
};

interface OrderStatusSelectProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  disabled?: boolean;
  isClosed?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const OrderStatusSelect: React.FC<OrderStatusSelectProps> = ({
  status,
  onStatusChange,
  disabled = false,
  isClosed = false,
  size = 'sm',
  className,
}) => {
  const currentKey = status.toLowerCase();
  const currentConfig = STATUS_CONFIG[currentKey] || STATUS_CONFIG.pending;
  const CurrentIcon = currentConfig.icon;

  if (isClosed || disabled || !onStatusChange) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border font-medium select-none shadow-xs transition-colors",
          size === 'sm' ? "text-[11px] h-6 px-2.5 gap-1.5" : "text-xs h-7 px-3 gap-1.5",
          currentConfig.badgeStyle,
          isClosed && "opacity-85 border-dashed cursor-not-allowed",
          className
        )}
        title={isClosed ? "This order is permanently closed and locked. Its status cannot be modified from the website." : undefined}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", isClosed ? "bg-slate-400" : cn("animate-pulse", currentConfig.dotColor))} />
        <CurrentIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>{currentConfig.label}</span>
        {isClosed && <Lock className={cn("text-muted-foreground ml-0.5", size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3")} />}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center rounded-full border font-medium transition-all duration-150 outline-none focus-visible:ring-1.5 focus-visible:ring-primary shadow-xs cursor-pointer select-none",
            size === 'sm' ? "text-[11px] h-6 px-2.5 gap-1.5" : "text-xs h-7 px-3 gap-1.5",
            currentConfig.badgeStyle,
            className
          )}
          title="Click to change order status"
        >
          <span className={cn("rounded-full ring-1 ring-white/60 dark:ring-black/20", size === 'sm' ? "w-1.5 h-1.5" : "w-2 h-2", currentConfig.dotColor)} />
          <CurrentIcon className={cn("transition-transform group-hover:scale-105", size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5")} />
          <span className="leading-none">{currentConfig.label}</span>
          <ChevronDown className={cn("opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180", size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-52 rounded-xl p-1.5 shadow-card border border-border/80 bg-popover/95 backdrop-blur-md z-50 animate-in fade-in-50 zoom-in-95"
      >
        <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Update Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 opacity-50" />

        <div className="space-y-0.5">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const isSelected = key === currentKey;
            const ItemIcon = config.icon;

            return (
              <DropdownMenuItem
                key={key}
                onClick={() => onStatusChange(key)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors outline-none",
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : config.itemHoverStyle
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0",
                      config.badgeStyle
                    )}
                  >
                    <ItemIcon className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs leading-tight">{config.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{config.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary ml-1.5 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
