import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { AuthForm, type AuthFormView } from '@/components/AuthForm';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Detect recovery mode from URL hash, search param, or auth event
  const isHashRecovery = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
  const isSearchReset = searchParams.get('reset') === 'true';
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(isHashRecovery || isSearchReset);

  const from = location.state?.from?.pathname || (isRecoveryMode ? '/admin' : '/');

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || searchParams.get('reset') === 'true') {
      setIsRecoveryMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  useEffect(() => {
    // Only auto-redirect if NOT in recovery mode
    if (user && !isRecoveryMode) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, isRecoveryMode]);

  const initialView: AuthFormView = isRecoveryMode ? 'reset_password' : 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cotton-candy/20 to-mint-fresh/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-playful rounded-3xl bg-card overflow-hidden">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center mb-1">
            <div className="bg-gradient-hero p-3.5 rounded-2xl shadow-sm">
              <Heart className="h-7 w-7 text-white animate-bounce-soft" />
            </div>
          </div>
          <CardTitle className="font-display text-3xl font-extrabold text-foreground">
            Yadawi
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm">
            Handcrafted plush toys made with love
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <AuthForm 
            initialView={initialView} 
            onSuccess={() => {
              setIsRecoveryMode(false);
              navigate(isRecoveryMode ? '/admin' : from, { replace: true });
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
