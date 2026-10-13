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
    const { signIn, signUp } = useAuth();
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
                title: 'Welcome to Yadawi!',
                description: 'Your account has been created successfully.'
            });
            if (onSuccess) onSuccess();
            if (!onSuccess) navigate('/');
        }
    };


    return (
        <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-body font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-body font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none mt-2">
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
