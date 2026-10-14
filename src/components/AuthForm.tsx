import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Shield,
  Mail,
  ArrowLeft,
  Sparkles,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export type AuthFormView = 'customer' | 'admin' | 'forgot_password' | 'reset_password';

interface AuthFormProps {
  initialView?: AuthFormView;
  onSuccess?: () => void;
}

export function AuthForm({ initialView = 'customer', onSuccess }: AuthFormProps) {
  const [view, setView] = useState<AuthFormView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { customerSignIn, signIn, resetPasswordForEmail, updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView]);

  // 1. Handle Customer Passwordless Sign In / Auto-Register
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);
    const { error, isNew } = await customerSignIn(email, displayName);
    setIsLoading(false);

    if (error) {
      if (error.message?.includes('Admin') || error.message?.toLowerCase().includes('rate limit')) {
        toast({
          title: 'Admin Login Required',
          description: error.message,
          variant: 'default',
        });
        setView('admin');
      } else {
        toast({
          title: 'Sign In Failed',
          description: error.message || 'Could not log in with this email.',
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: isNew ? 'Welcome to Yadawi!' : 'Welcome Back!',
      description: isNew
        ? 'Your account was created and you are now signed in.'
        : 'You have successfully signed in.',
    });

    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/');
    }
  };

  // 2. Handle Admin Password Sign In
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Admin Sign In Failed',
        description:
          error.message === 'Invalid login credentials'
            ? 'Invalid admin email or password. Please verify your credentials.'
            : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Admin Access Granted',
        description: 'Signed in successfully with administrative privileges.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    }
  };

  // 3. Handle Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Reset Request Failed',
        description: error.message || 'Could not send reset password email.',
        variant: 'destructive',
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: `We sent a password reset link to ${email}. Please check your inbox.`,
      });
    }
  };

  // 4. Handle Setting New Password (Recovery Session)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Password Update Failed',
        description: error.message || 'Failed to update your password.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Updated!',
        description: 'Your password has been changed successfully. Welcome back!',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    }
  };

  return (
    <div className="w-full">
      {/* VIEW: CUSTOMER PASSWORDLESS LOGIN */}
      {view === 'customer' && (
        <div className="space-y-4">
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer-email" className="text-xs font-semibold text-foreground">
                Your Email Address *
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-name" className="text-xs font-semibold text-muted-foreground">
                Name <span className="text-[11px] font-normal">(Optional)</span>
              </Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="e.g. Sarah Ahmed"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold shadow-sm"
              variant="hero"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enter Email & Continue
            </Button>
          </form>

          {/* Admin Switcher */}
          <div className="pt-3 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={() => {
                setView('admin');
                setPassword('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium py-1"
            >
              <Shield className="w-3.5 h-3.5 text-primary/70" />
              <span>Admin Portal Login</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: ADMIN PASSWORD LOGIN */}
      {view === 'admin' && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Admin Protected Area</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Sign in with your administrator email and password credentials.
            </p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-foreground">
                Admin Email *
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@yadawi.store"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                  Admin Password *
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                    setResetEmailSent(false);
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 rounded-xl text-sm"
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

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold shadow-sm"
              variant="hero"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Sign In as Admin
            </Button>
          </form>

          {/* Back to Customer Login */}
          <div className="pt-3 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={() => {
                setView('customer');
                setPassword('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Login</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: FORGOT PASSWORD REQUEST */}
      {view === 'forgot_password' && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Recovery</span>
            </div>
            <h2 className="text-lg font-bold text-foreground pt-1">Reset Admin Password</h2>
            <p className="text-xs text-muted-foreground">
              Enter your registered admin email. We will send you a secure link to reset your password.
            </p>
          </div>

          {resetEmailSent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                Password reset link sent to:
              </p>
              <p className="text-xs font-mono font-bold text-foreground break-all">{email}</p>
              <p className="text-[11px] text-muted-foreground">
                Please check your inbox (and spam folder) and click the link to choose your new password.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs mt-2"
                onClick={() => setResetEmailSent(false)}
              >
                Send Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-foreground">
                  Admin Account Email *
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="admin@yadawi.store"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 rounded-xl text-sm font-mono"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold shadow-sm"
                variant="hero"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Send Reset Link
              </Button>
            </form>
          )}

          {/* Back to Admin Login */}
          <div className="pt-3 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={() => {
                setView('admin');
                setResetEmailSent(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Login</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: RESET PASSWORD (AFTER CLICKING EMAIL LINK) */}
      {view === 'reset_password' && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Create New Password</span>
            </div>
            <h2 className="text-lg font-bold text-foreground pt-1">Set New Admin Password</h2>
            <p className="text-xs text-muted-foreground">
              Please enter your new administrator password below to regain access.
            </p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                New Password *
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 rounded-xl text-sm"
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
              <Label htmlFor="confirm-new-password" className="text-xs font-semibold text-foreground">
                Confirm New Password *
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold shadow-sm"
              variant="hero"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Update Password & Access Admin
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
