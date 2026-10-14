import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { AuthForm, type AuthFormView } from '@/components/AuthForm';

export default function Auth() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = location.state?.from?.pathname || (isAdmin ? '/admin' : '/');

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const activeView: AuthFormView = searchParams.get('admin') === 'true' ? 'admin' : 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cotton-candy/20 to-mint-fresh/20 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-playful rounded-2xl sm:rounded-3xl bg-card overflow-hidden">
        <CardHeader className="text-center space-y-1.5 sm:space-y-2 pb-3 sm:pb-4">
          <div className="flex justify-center mb-1">
            <div className="bg-gradient-hero p-2.5 sm:p-3.5 rounded-2xl shadow-sm">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-bounce-soft" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Yadawi
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm">
            Handcrafted plush toys made with love
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <AuthForm 
            initialView={activeView}
            onSuccess={() => {
              navigate(from, { replace: true });
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
