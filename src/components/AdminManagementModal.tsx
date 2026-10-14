import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  UserPlus,
  Users,
  ShieldAlert,
  Shield,
  KeyRound,
  Trash2,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { confirmResetPasswordAlert, confirmRevokeAdminAlert } from '@/lib/sweetAlert';

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'superadmin';
  created_at?: string;
}

interface AdminManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminManagementModal({
  open,
  onOpenChange
}: AdminManagementModalProps) {
  const { user, isSuperAdmin, createAdminAccount, revokeAdminAccount, resetAdminPasswordDefault } = useAuth();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Form state for creating an admin
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('Yadawi@123');
  const [assignedRole, setAssignedRole] = useState<'admin' | 'superadmin'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch admin team
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      // 1. Try secure RPC function
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_admin_users');

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        setAdmins(rpcData as AdminUser[]);
        setIsLoadingAdmins(false);
        return;
      }

      // 2. Fallback: query user_roles table directly
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .in('role', ['admin', 'superadmin']);

      if (!rolesError && rolesData) {
        // Query profiles if possible
        const userIds = rolesData.map((r) => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p.display_name]));

        const fallbackList: AdminUser[] = rolesData.map((r) => ({
          user_id: r.user_id,
          role: r.role as 'admin' | 'superadmin',
          created_at: r.created_at,
          email: r.user_id === user?.id ? (user?.email || 'Current SuperAdmin') : `User #${r.user_id.substring(0, 8)}`,
          display_name: profileMap.get(r.user_id) || (r.user_id === user?.id ? 'You' : 'Admin Colleague'),
        }));

        setAdmins(fallbackList);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (open && isSuperAdmin) {
      fetchAdmins();
    }
  }, [open, isSuperAdmin]);

  // Generate strong random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setShowPassword(true);
  };

  // Submit new admin creation
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only SuperAdmins have access to create admin accounts.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Admin passwords must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    const { error, user: createdUser } = await createAdminAccount(
      newEmail,
      newPassword,
      newName,
      assignedRole
    );
    setIsCreating(false);

    if (error) {
      toast({
        title: 'Account Creation Failed',
        description: error.message || 'Could not create admin account.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Admin Created Successfully!',
        description: `New ${assignedRole === 'superadmin' ? 'SuperAdmin' : 'Admin'} (${newEmail}) has been created.`,
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('Yadawi@123');
      setActiveTab('list');
      fetchAdmins();
    }
  };

  // Reset admin password directly to default: Yadawi@123
  const handleResetPasswordToDefault = async (admin: AdminUser) => {
    const adminLabel = admin.display_name || admin.email;
    const confirmed = await confirmResetPasswordAlert(adminLabel, admin.email);
    if (!confirmed) return;

    setActionLoadingId(admin.user_id);
    const { error } = await resetAdminPasswordDefault(admin.user_id);
    setActionLoadingId(null);

    if (error) {
      toast({
        title: 'Reset Password Failed',
        description: error.message || 'Could not reset admin password. Please run the reset SQL function in Supabase.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Reset to Default!',
        description: `Password for ${admin.email} has been reset to: Yadawi@123. The admin can now sign in with Yadawi@123.`,
        duration: 8000,
      });
    }
  };

  // Revoke admin role
  const handleRevoke = async (admin: AdminUser) => {
    if (admin.user_id === user?.id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot revoke your own SuperAdmin privileges.',
        variant: 'destructive',
      });
      return;
    }

    const adminLabel = admin.display_name || admin.email;
    const confirmed = await confirmRevokeAdminAlert(adminLabel, admin.email);
    if (!confirmed) return;

    setActionLoadingId(admin.user_id);
    const { error } = await revokeAdminAccount(admin.user_id);
    setActionLoadingId(null);

    if (error) {
      toast({
        title: 'Revoke Failed',
        description: error.message || 'Could not revoke admin role.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Admin Privileges Revoked',
        description: `${admin.display_name || admin.email} is no longer an administrator.`,
      });
      fetchAdmins();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onPointerDownOutside={(e) => {
          if (document.querySelector('.swal2-container')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (document.querySelector('.swal2-container')) {
            e.preventDefault();
          }
        }}
        className="w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl"
      >
        {/* Header */}
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60 shrink-0 text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-display text-lg sm:text-xl text-foreground">
                    SuperAdmin Management
                  </DialogTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                    SuperAdmin Only
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Create and manage administrator accounts and credentials for your team
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Subnavigation Tabs */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Admin Team</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {admins.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Admin</span>
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 sm:px-6 sm:py-5 custom-scrollbar min-h-0">
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Active administrators with store access</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAdmins}
                  disabled={isLoadingAdmins}
                  className="h-7 text-xs gap-1.5 px-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdmins ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>

              {isLoadingAdmins && admins.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p>Loading administrators...</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-border/80 p-6 space-y-3">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-medium text-foreground">No extra admin accounts found</p>
                  <Button
                    variant="hero"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setActiveTab('create')}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Create First Colleague Admin
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {admins.map((adm) => {
                    const isCurrent = adm.user_id === user?.id;
                    const isSuper = adm.role === 'superadmin';

                    return (
                      <div
                        key={adm.user_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/30 transition-colors shadow-sm"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${isSuper ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                            {isSuper ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                                {adm.display_name || 'Admin Colleague'}
                              </span>
                              {isCurrent && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                  You
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 font-semibold ${
                                  isSuper
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-primary/10 text-primary border-primary/20'
                                }`}
                              >
                                {isSuper ? 'SuperAdmin' : 'Admin'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="font-mono text-[11px] truncate">{adm.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 rounded-xl border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 text-foreground font-medium"
                            onClick={() => handleResetPasswordToDefault(adm)}
                            disabled={actionLoadingId === adm.user_id}
                            title="Reset password to default: Yadawi@123"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="hidden sm:inline">Reset to Default</span>
                            <span className="sm:hidden">Reset</span>
                          </Button>

                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-xl px-2"
                              onClick={() => handleRevoke(adm)}
                              disabled={actionLoadingId === adm.user_id}
                              title="Revoke admin privileges"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                <div className="font-bold flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Admin Credentials</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-new-email" className="text-xs font-semibold">
                    Admin Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="admin-new-email"
                      type="email"
                      placeholder="colleague@yadawi.store"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-new-name" className="text-xs font-semibold text-muted-foreground">
                    Colleague Name <span className="text-[11px] font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="admin-new-name"
                    type="text"
                    placeholder="e.g. Omar Hassan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-new-pass" className="text-xs font-semibold">
                    Set Initial Password *
                  </Label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Strong Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="admin-new-pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters (e.g. Yadawi#2026!)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10 h-10 rounded-xl text-sm font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Account Role Privilege</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignedRole('admin')}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      assignedRole === 'admin'
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/80 hover:border-border bg-card'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Standard Admin</p>
                      <p className="text-[11px] text-muted-foreground">Manage products, orders & delivery fees</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignedRole('superadmin')}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      assignedRole === 'superadmin'
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                        : 'border-border/80 hover:border-border bg-card'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground">SuperAdmin</p>
                      <p className="text-[11px] text-muted-foreground">Can also create & manage other admins</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('list')}
                  className="rounded-xl text-xs h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isCreating}
                  className="rounded-xl text-xs h-10 font-bold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
