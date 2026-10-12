import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchEmailSettings,
  saveEmailSettings,
  sendTestNotificationEmail,
  type EmailSettings
} from '@/lib/emailService';

interface AdminEmailSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: () => void;
}

const SAMPLE_TEMPLATE = `Subject: New Order {{order_id}} from {{customer_name}}!

Hello AYORI Admin!

You have received a new order on AYORI Plushies Store:

Order Details:
------------------------------------------
• Order ID: {{order_id}}
• Order Date: {{order_date}}
• Total Amount: {{total_amount}}

Customer Information:
------------------------------------------
• Name: {{customer_name}}
• Email: {{customer_email}}
• Phone: {{customer_phone}}
• Shipping Address: {{shipping_address}}

Items Ordered:
------------------------------------------
{{items_summary}}

Subtotal: {{subtotal}}
Delivery Fee: {{delivery_fee}}
Grand Total: {{total_amount}}

View and manage this order here:
{{admin_orders_link}}
`;

export function AdminEmailSettingsModal({
  open,
  onOpenChange,
  onSettingsSaved
}: AdminEmailSettingsModalProps) {
  const [adminEmail, setAdminEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [enabled, setEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message?: string;
  }>({ status: null });
  const [showGuide, setShowGuide] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Load existing settings when modal opens
  useEffect(() => {
    if (open) {
      loadSettings();
      setTestResult({ status: null });
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const current = await fetchEmailSettings();
      setAdminEmail(current.adminEmail);
      setServiceId(current.serviceId);
      setTemplateId(current.templateId);
      setPublicKey(current.publicKey);
      setEnabled(current.enabled);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load email settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveEmailSettings({
        adminEmail,
        serviceId,
        templateId,
        publicKey,
        enabled
      });

      if (res.success) {
        toast.success('Email notification settings saved successfully!');
        if (onSettingsSaved) onSettingsSaved();
        onOpenChange(false);
      } else {
        toast.error('Failed to save settings to database');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestResult({ status: null });
    try {
      const currentConfig: EmailSettings = {
        adminEmail,
        serviceId,
        templateId,
        publicKey,
        enabled
      };

      const result = await sendTestNotificationEmail(currentConfig);

      if (result.success) {
        setTestResult({
          status: 'success',
          message: result.message || 'Test email successfully dispatched!'
        });
        toast.success('Test notification email sent! Check your inbox.');
      } else {
        setTestResult({
          status: 'error',
          message: result.message || 'Failed to send test email.'
        });
        toast.error(result.message || 'Test email failed');
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Unexpected error sending test'
      });
      toast.error('Test email failed');
    } finally {
      setIsTesting(false);
    }
  };

  const copyTemplateToClipboard = () => {
    navigator.clipboard.writeText(SAMPLE_TEMPLATE);
    setCopiedTemplate(true);
    toast.success('Template copied to clipboard!');
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const isConfigured = Boolean(
    adminEmail.trim() && serviceId.trim() && templateId.trim() && publicKey.trim()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-8">
        <DialogHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl sm:text-2xl text-foreground">
                  Admin Email Notifications
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Receive instant email alerts whenever a customer submits a new order
                </DialogDescription>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              {isConfigured ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5">
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold px-2.5 py-0.5">
                  Setup Required
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading email settings...</p>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Enable Order Notifications</span>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Send an automatic email every time an order is placed on checkout.
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Toggle notifications"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="adminEmail" className="text-xs font-semibold text-foreground">
                  Admin Recipient Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@ayori.store or your-personal@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="rounded-xl h-10 text-sm bg-background border-border"
                />
                <p className="text-[11px] text-muted-foreground">
                  The admin inbox where all new order notifications will be delivered.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="serviceId" className="text-xs font-semibold text-foreground">
                    EmailJS Service ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serviceId"
                    placeholder="e.g. service_gmail or service_xxxx"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="rounded-xl h-10 text-sm font-mono bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="templateId" className="text-xs font-semibold text-foreground">
                    EmailJS Template ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="templateId"
                    placeholder="e.g. template_new_order"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="rounded-xl h-10 text-sm font-mono bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="publicKey" className="text-xs font-semibold text-foreground">
                  EmailJS Public Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="publicKey"
                  type="text"
                  placeholder="e.g. v9eX8_..."
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="rounded-xl h-10 text-sm font-mono bg-background border-border"
                />
                <p className="text-[11px] text-muted-foreground">
                  Found in EmailJS Account Settings &gt; Public Key.
                </p>
              </div>
            </div>

            {/* Test Send Feedback Alert */}
            {testResult.status && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                  testResult.status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {testResult.status === 'success' ? 'Email Test Succeeded!' : 'Email Test Failed'}
                  </p>
                  <p className="mt-0.5 opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Quick Setup Guide Accordion */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span>How to connect EmailJS in 2 minutes (Free)</span>
                </div>
                {showGuide ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showGuide && (
                <div className="px-4 pb-4 pt-1 space-y-4 text-xs text-muted-foreground border-t border-border/40">
                  <ol className="list-decimal list-inside space-y-2 text-foreground/90 font-medium">
                    <li>
                      Create a free account at{' '}
                      <a
                        href="https://www.emailjs.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline inline-flex items-center gap-0.5"
                      >
                        EmailJS.com <ExternalLink className="w-3 h-3 inline" />
                      </a>{' '}
                      (includes 200 free emails/month).
                    </li>
                    <li>
                      Go to <strong>Email Services</strong> &gt; Click <strong>Add New Service</strong> &gt; Select Gmail or Outlook and connect your email. Copy the <strong>Service ID</strong>.
                    </li>
                    <li>
                      Go to <strong>Email Templates</strong> &gt; Click <strong>Create New Template</strong>. Paste the template below into the Content box, and copy the <strong>Template ID</strong>.
                    </li>
                    <li>
                      In the template settings, set <strong>To Email</strong> to <code>{'{{to_email}}'}</code> or your admin address.
                    </li>
                    <li>
                      Go to <strong>Account Settings</strong> &gt; Copy your <strong>Public Key</strong>.
                    </li>
                  </ol>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Recommended Template Content:</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyTemplateToClipboard}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copiedTemplate ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Template
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 rounded-xl bg-background border text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-foreground/80">
                      {SAMPLE_TEMPLATE}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2.5 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleSendTest}
            disabled={isTesting || isLoading || !adminEmail}
            className="rounded-xl h-10 gap-2 border-border text-xs sm:text-sm font-semibold"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Send className="w-4 h-4 text-primary" />
            )}
            Send Test Email
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="hero"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="rounded-xl h-10 px-6 text-xs sm:text-sm font-bold shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
