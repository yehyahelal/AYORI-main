import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, Mail, ArrowLeft, Sparkles, Lock } from 'lucide-react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { customerSignIn, signIn } = useAuth();
  const navigate = useNavigate();

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
      // If error indicates this is an admin email with a custom password, helpfully prompt them
      if (error.message?.includes('Admin')) {
        toast({
          title: 'Admin Account Detected',
          description: error.message,
          variant: 'default',
        });
        setIsAdminMode(true);
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

  return (
    <div className="w-full">
      {!isAdminMode ? (
        /* CUSTOMER PASSWORDLESS LOGIN */
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Login & Checkout</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Enter your email to sign in or create an account automatically. No password required!
            </p>
          </div>

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
              Continue with Email
            </Button>
          </form>

          {/* Admin Switcher */}
          <div className="pt-3 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(true);
                setPassword('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium py-1"
            >
              <Shield className="w-3.5 h-3.5 text-primary/70" />
              <span>Admin Portal Login</span>
            </button>
          </div>
        </div>
      ) : (
        /* ADMIN PASSWORD LOGIN */
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
              <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                Admin Password *
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                setIsAdminMode(false);
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
    </div>
  );
}
