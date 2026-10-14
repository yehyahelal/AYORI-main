import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminChangePasswordModal({
  open,
  onOpenChange
}: AdminChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updatePassword, user } = useAuth();

  const handleReset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords match identically.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Password Update Failed',
        description: error.message || 'Could not update your password.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Updated Successfully',
        description: 'Your account password has been changed.',
      });
      handleReset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleReset();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl">
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60 shrink-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg sm:text-xl text-foreground">
                Change Account Password
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update credentials for {user?.email || 'your administrator account'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-4 sm:px-6 sm:py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-new-password" className="text-xs sm:text-sm font-semibold">
              New Password *
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="change-new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 pr-10 h-10 rounded-xl text-sm"
                required
                autoFocus
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
            <Label htmlFor="change-confirm-password" className="text-xs sm:text-sm font-semibold">
              Confirm New Password *
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="change-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 h-10 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={isSubmitting}
              className="rounded-xl h-10 text-xs sm:text-sm font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
