import { supabase } from '@/integrations/supabase/client';

export interface OrderItemStockInfo {
  productId: string;
  title: string;
  image?: string;
  quantity: number;
}

/**
 * Fetch items in an order with product title and quantity for dialog preview.
 */
export const getOrderStockItems = async (orderId: string): Promise<OrderItemStockInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, products(id, title, images)')
      .eq('order_id', orderId);

    if (error || !data) return [];

    return data.map((item: any) => ({
      productId: item.product_id,
      title: item.products?.title || 'Plush Toy',
      image: item.products?.images?.[0],
      quantity: Number(item.quantity) || 1,
    }));
  } catch (err) {
    console.error('Error fetching order stock items:', err);
    return [];
  }
};

/**
 * Restocks items for an order back into the products inventory.
 * Tries the database RPC first, and falls back to client-side updates if the RPC isn't deployed yet.
 */
export const restockOrderInventory = async (
  orderId: string
): Promise<{ success: boolean; count: number }> => {
  try {
    // 1. Fetch the order items first so we know quantities
    const items = await getOrderStockItems(orderId);
    if (items.length === 0) return { success: true, count: 0 };

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // 2. Try the secure SQL stored procedure first
    const { error: rpcError } = await supabase.rpc('restock_order_items', {
      p_order_id: orderId,
    });

    if (!rpcError) {
      return { success: true, count: totalCount };
    }

    console.warn('RPC restock_order_items not available, falling back to direct update:', rpcError);

    // 3. Client-side fallback: update each product's inventory
    for (const item of items) {
      if (!item.productId) continue;

      const { data: product } = await supabase
        .from('products')
        .select('inventory_count')
        .eq('id', item.productId)
        .single();

      const currentStock = Number(product?.inventory_count || 0);
      const updatedStock = currentStock + item.quantity;

      await supabase
        .from('products')
        .update({ inventory_count: updatedStock })
        .eq('id', item.productId);
    }

    return { success: true, count: totalCount };
  } catch (err) {
    console.error('Failed to restock order items:', err);
    return { success: false, count: 0 };
  }
};

/**
 * Re-deducts items for an order if it is reactivated from cancelled/returned.
 */
export const deductOrderInventory = async (
  orderId: string
): Promise<{ success: boolean; count: number }> => {
  try {
    const items = await getOrderStockItems(orderId);
    if (items.length === 0) return { success: true, count: 0 };

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const { error: rpcError } = await supabase.rpc('deduct_order_items', {
      p_order_id: orderId,
    });

    if (!rpcError) {
      return { success: true, count: totalCount };
    }

    // Client-side fallback
    for (const item of items) {
      if (!item.productId) continue;

      const { data: product } = await supabase
        .from('products')
        .select('inventory_count')
        .eq('id', item.productId)
        .single();

      const currentStock = Number(product?.inventory_count || 0);
      const updatedStock = Math.max(0, currentStock - item.quantity);

      await supabase
        .from('products')
        .update({ inventory_count: updatedStock })
        .eq('id', item.productId);
    }

    return { success: true, count: totalCount };
  } catch (err) {
    console.error('Failed to re-deduct order items:', err);
    return { success: false, count: 0 };
  }
};
