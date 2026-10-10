import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface AuthFormProps {
    onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signUp, signInWithOAuth } = useAuth();
    const navigate = useNavigate();

    const validateInputs = () => {
        try {
            emailSchema.parse(email);
            passwordSchema.parse(password);
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: 'Validation Error',
                    description: error.errors[0].message,
                    variant: 'destructive'
                });
            }
            return false;
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setIsLoading(true);
        const { error } = await signIn(email, password);
        setIsLoading(false);

        if (error) {
            toast({
                title: 'Sign in failed',
                description: error.message === 'Invalid login credentials'
                    ? 'Invalid email or password. Please try again.'
                    : error.message,
                variant: 'destructive'
            });
        } else {
            toast({
                title: 'Welcome back!',
                description: 'You have successfully signed in.'
            });
            if (onSuccess) onSuccess();
            if (!onSuccess) navigate('/');
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setIsLoading(true);
        const { error } = await signUp(email, password, displayName);
        setIsLoading(false);

        if (error) {
            let message = error.message;
            if (error.message.includes('already registered')) {
                message = 'This email is already registered. Please sign in instead.';
            }
            toast({
                title: 'Sign up failed',
                description: message,
                variant: 'destructive'
            });
        } else {
            toast({
                title: 'Welcome to AYORI!',
                description: 'Your account has been created successfully.'
            });
            if (onSuccess) onSuccess();
            if (!onSuccess) navigate('/');
        }
    };

    const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
        setIsLoading(true);
        const { error } = await signInWithOAuth(provider);
        setIsLoading(false);

        if (error) {
            toast({
                title: "Sign in failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-body font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-body font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none mt-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Button variant="outline" onClick={() => handleOAuthSignIn('google')} className="w-full" disabled={isLoading}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        Google
                    </Button>
                    <Button variant="outline" onClick={() => handleOAuthSignIn('facebook')} className="w-full" disabled={isLoading}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
                        Facebook
                    </Button>
                </div>
                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                            id="signin-email"
                            type="email"
                            placeholder="cuddle@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Sign In
                    </Button>
                </form>
            </TabsContent>

            <TabsContent value="signup" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none mt-2">
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signup-name">Display Name</Label>
                        <Input
                            id="signup-name"
                            type="text"
                            placeholder="Cuddle Lover"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                            id="signup-email"
                            type="email"
                            placeholder="cuddle@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Account
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
    );
}
