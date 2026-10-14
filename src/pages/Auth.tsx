import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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
          <AuthForm onSuccess={() => navigate(from, { replace: true })} />
        </CardContent>
      </Card>
    </div>
  );
}
