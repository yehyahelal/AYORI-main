/**
 * Utilities for generating, formatting, and searching unique Order IDs.
 * Format requirement: "#123456" (6 digits prefixed by #).
 */

/**
 * Generates a unique 6-digit order ID in the format "#123456".
 */
export const generateOrderNumber = (): string => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `#${num}`;
};

/**
 * Returns the formatted order ID (e.g. "#123456").
 * If the database order has an order_number, uses that.
 * If legacy order has no order_number, generates a deterministic 6-digit ID from its UUID.
 */
export const formatOrderNumber = (
  order?: { order_number?: string | null; id?: string | null } | null
): string => {
  if (!order) return "#000000";

  if (order.order_number && order.order_number.trim() !== '') {
    const trimmed = order.order_number.trim();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }

  if (order.id) {
    // Generate a consistent, deterministic 6-digit code for existing legacy orders
    let hash = 0;
    const str = String(order.id);
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    const num = (Math.abs(hash) % 900000) + 100000;
    return `#${num}`;
  }

  return "#100001";
};

/**
 * Clean query string for order searching (strips #, spaces, lowercase).
 */
export const cleanOrderSearch = (query: string): string => {
  return query.replace(/^#+/, '').trim().toLowerCase();
};

/**
 * Checks whether an order matches a given search term.
 * Matches order_number (with or without #), UUID id, customer name, email, or phone.
 */
export const orderMatchesQuery = (
  order: any,
  query: string
): boolean => {
  if (!query || query.trim() === '') return true;

  const rawQuery = query.trim().toLowerCase();
  const cleaned = cleanOrderSearch(query);
  const formattedId = formatOrderNumber(order).toLowerCase();
  const rawOrderNumber = (order.order_number || '').toLowerCase();
  const cleanDbNumber = cleanOrderSearch(rawOrderNumber);

  // Match order number with or without #
  if (formattedId.includes(rawQuery) || cleanOrderSearch(formattedId).includes(cleaned)) return true;
  if (rawOrderNumber.includes(rawQuery) || cleanDbNumber.includes(cleaned)) return true;

  // Match UUID
  if (order.id && order.id.toLowerCase().includes(rawQuery)) return true;

  // Match Customer Name
  if (order.customer_name && order.customer_name.toLowerCase().includes(rawQuery)) return true;

  // Match Customer Email
  if (order.customer_email && order.customer_email.toLowerCase().includes(rawQuery)) return true;

  // Match Phone Number
  if (order.phone_number && order.phone_number.toLowerCase().includes(rawQuery)) return true;

  // Match Shipping Address
  if (order.shipping_address && order.shipping_address.toLowerCase().includes(rawQuery)) return true;

  return false;
};
