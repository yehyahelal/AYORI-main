import emailjs from '@emailjs/browser';
import { supabase } from '@/integrations/supabase/client';
import { formatOrderNumber } from '@/lib/orderUtils';

export interface EmailSettings {
  adminEmail: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

export interface SendEmailResult {
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Loads Email and EmailJS configuration from Supabase store_settings,
 * falling back to environment variables if not yet set in database.
 */
export async function fetchEmailSettings(): Promise<EmailSettings & { isConfigured: boolean }> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', [
        'admin_notification_email',
        'admin_email',
        'emailjs_service_id',
        'emailjs_template_id',
        'emailjs_public_key',
        'email_notifications_enabled'
      ]);

    const settingsMap: Record<string, string> = {};
    if (data && !error) {
      data.forEach((row) => {
        settingsMap[row.key] = row.value;
      });
    }

    const adminEmail =
      settingsMap['admin_notification_email'] ||
      settingsMap['admin_email'] ||
      import.meta.env.VITE_ADMIN_EMAIL ||
      '';

    const serviceId =
      settingsMap['emailjs_service_id'] ||
      import.meta.env.VITE_EMAILJS_SERVICE_ID ||
      '';

    const templateId =
      settingsMap['emailjs_template_id'] ||
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
      '';

    const publicKey =
      settingsMap['emailjs_public_key'] ||
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY ||
      '';

    const enabledRaw = settingsMap['email_notifications_enabled'];
    const enabled = enabledRaw === undefined ? true : enabledRaw !== 'false';

    const isConfigured = Boolean(
      adminEmail.trim() && serviceId.trim() && templateId.trim() && publicKey.trim()
    );

    return {
      adminEmail,
      serviceId,
      templateId,
      publicKey,
      enabled,
      isConfigured
    };
  } catch (err) {
    console.warn('Failed to load email settings from DB, using env fallback:', err);
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
    const isConfigured = Boolean(
      adminEmail.trim() && serviceId.trim() && templateId.trim() && publicKey.trim()
    );

    return {
      adminEmail,
      serviceId,
      templateId,
      publicKey,
      enabled: true,
      isConfigured
    };
  }
}

/**
 * Saves or updates email notification settings in the database.
 */
export async function saveEmailSettings(settings: {
  adminEmail: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}): Promise<{ success: boolean; error?: any }> {
  try {
    const updates = [
      { key: 'admin_notification_email', value: settings.adminEmail.trim() },
      { key: 'emailjs_service_id', value: settings.serviceId.trim() },
      { key: 'emailjs_template_id', value: settings.templateId.trim() },
      { key: 'emailjs_public_key', value: settings.publicKey.trim() },
      { key: 'email_notifications_enabled', value: settings.enabled ? 'true' : 'false' }
    ];

    for (const item of updates) {
      const { error } = await supabase
        .from('store_settings')
        .upsert(item, { onConflict: 'key' });
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save email settings:', err);
    return { success: false, error: err };
  }
}

/**
 * Formats order items into clean, human-readable text and HTML summaries.
 */
function formatItemsSummary(items: any[]): { text: string; html: string } {
  if (!items || items.length === 0) {
    return { text: 'No items recorded', html: '<p>No items recorded</p>' };
  }

  const lines = items.map((item, idx) => {
    const title = item.product?.title || item.title || `Item #${idx + 1}`;
    const qty = item.quantity || 1;
    const price = item.product?.price || item.price_at_time || 0;
    const itemTotal = (price * qty).toFixed(2);
    return `${idx + 1}. ${title} x${qty} — ${itemTotal} EGP`;
  });

  const htmlList = items.map((item, idx) => {
    const title = item.product?.title || item.title || `Item #${idx + 1}`;
    const qty = item.quantity || 1;
    const price = item.product?.price || item.price_at_time || 0;
    const itemTotal = (price * qty).toFixed(2);
    return `<li style="margin-bottom: 6px;"><strong>${title}</strong> &times; ${qty} — <em>${itemTotal} EGP</em></li>`;
  }).join('');

  return {
    text: lines.join('\n'),
    html: `<ul style="padding-left: 20px; line-height: 1.6;">${htmlList}</ul>`
  };
}

/**
 * Sends an email notification to the store administrator whenever a customer places an order.
 * This is designed to be NON-BLOCKING so customer checkout is NEVER failed if email sending fails.
 */
export async function sendOrderNotificationEmail({
  order,
  items,
  deliveryFee = 0,
  totalPrice = 0
}: {
  order: any;
  items: any[];
  deliveryFee?: number;
  totalPrice?: number;
}): Promise<SendEmailResult> {
  try {
    const settings = await fetchEmailSettings();

    if (!settings.enabled) {
      console.log('Admin order email notification skipped: notifications disabled in settings.');
      return { success: false, message: 'Notifications disabled' };
    }

    if (!settings.isConfigured) {
      console.warn(
        'Admin order email notification skipped: EmailJS or Admin Email not yet configured in store_settings or .env'
      );
      return { success: false, message: 'Email settings not configured' };
    }

    const orderIdFormatted = formatOrderNumber(order);
    const { text: itemsText, html: itemsHtml } = formatItemsSummary(items);
    const subtotal = Math.max(0, (totalPrice || 0) - (deliveryFee || 0));
    const nowFormatted = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const storeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ayori.store';
    const orderLink = `${storeOrigin}/orders`;
    const adminOrdersLink = `${storeOrigin}/admin/orders`;

    const templateParams: Record<string, any> = {
      // Recipient identifiers
      to_email: settings.adminEmail,
      admin_email: settings.adminEmail,
      recipient: settings.adminEmail,

      // Order Information
      order_id: orderIdFormatted,
      order_number: orderIdFormatted,
      order_date: nowFormatted,
      status: 'pending',

      // Customer Details
      customer_name: order.customer_name || 'Guest Customer',
      customer_email: order.customer_email || 'Not provided',
      customer_phone: order.phone_number || 'Not provided',
      shipping_address: order.shipping_address || 'Not provided',

      // Financials & Items
      items_summary: itemsText,
      order_items: itemsText,
      order_items_html: itemsHtml,
      subtotal: `${subtotal.toFixed(2)} EGP`,
      delivery_fee: `${deliveryFee.toFixed(2)} EGP`,
      total_amount: `${(totalPrice || 0).toFixed(2)} EGP`,
      total_price: `${(totalPrice || 0).toFixed(2)} EGP`,

      // Quick Action Links
      order_link: orderLink,
      admin_orders_link: adminOrdersLink
    };

    console.log(`Sending new order notification for ${orderIdFormatted} to ${settings.adminEmail}...`);

    const response = await emailjs.send(
      settings.serviceId,
      settings.templateId,
      templateParams,
      settings.publicKey
    );

    console.log('Order notification email sent successfully:', response.status, response.text);
    return { success: true, message: 'Notification email delivered to admin' };
  } catch (err: any) {
    console.error('Failed to send admin order notification email:', err);
    return {
      success: false,
      message: err?.text || err?.message || 'Failed to send email',
      error: err
    };
  }
}

/**
 * Sends a test email to verify that EmailJS keys and admin email are functioning properly.
 */
export async function sendTestNotificationEmail(
  settings: EmailSettings
): Promise<SendEmailResult> {
  if (!settings.adminEmail.trim()) {
    return { success: false, message: 'Please enter a valid Admin Email address.' };
  }
  if (!settings.serviceId.trim() || !settings.templateId.trim() || !settings.publicKey.trim()) {
    return { success: false, message: 'Please provide EmailJS Service ID, Template ID, and Public Key.' };
  }

  try {
    const storeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ayori.store';
    const testParams: Record<string, any> = {
      to_email: settings.adminEmail.trim(),
      admin_email: settings.adminEmail.trim(),
      recipient: settings.adminEmail.trim(),

      order_id: '#TEST99',
      order_number: '#TEST99',
      order_date: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
      status: 'Test Notification',

      customer_name: 'AYORI Notification Test',
      customer_email: 'test@ayori.store',
      customer_phone: '+20 100 000 0000',
      shipping_address: '123 Fluffy Boulevard, Cairo, Egypt',

      items_summary: '1. AYORI Giant Fluffy Bunny Plush x1 — 350.00 EGP\n2. Mini Chubby Panda Keyring x2 — 180.00 EGP',
      order_items: '1. AYORI Giant Fluffy Bunny Plush x1 — 350.00 EGP\n2. Mini Chubby Panda Keyring x2 — 180.00 EGP',
      order_items_html: '<ul><li>AYORI Giant Fluffy Bunny Plush &times; 1 (350.00 EGP)</li><li>Mini Chubby Panda Keyring &times; 2 (180.00 EGP)</li></ul>',

      subtotal: '530.00 EGP',
      delivery_fee: '50.00 EGP',
      total_amount: '580.00 EGP',
      total_price: '580.00 EGP',

      order_link: `${storeOrigin}/orders`,
      admin_orders_link: `${storeOrigin}/admin/orders`
    };

    const response = await emailjs.send(
      settings.serviceId.trim(),
      settings.templateId.trim(),
      testParams,
      settings.publicKey.trim()
    );

    return {
      success: true,
      message: `Test email sent successfully to ${settings.adminEmail.trim()}! Status: ${response.status}`
    };
  } catch (err: any) {
    console.error('EmailJS test send error:', err);
    return {
      success: false,
      message: err?.text || err?.message || 'EmailJS rejected the request. Please check your credentials.',
      error: err
    };
  }
}
