import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';

import { Heart } from 'lucide-react';

export function AuthModal() {
    const { user, loading } = useAuth();
    const { isAuthModalOpen, openAuthModal, closeAuthModal } = useUIStore();
    const [hasSeenModal, setHasSeenModal] = useState(() => {
        return sessionStorage.getItem('hasSeenAuthModal') === 'true';
    });

    useEffect(() => {
        // If not loading, no user, and hasn't seen modal yet
        if (!loading && !user && !hasSeenModal) {
            openAuthModal();
        }
    }, [user, loading, hasSeenModal, openAuthModal]);

    const handleClose = () => {
        closeAuthModal();
        setHasSeenModal(true);
        sessionStorage.setItem('hasSeenAuthModal', 'true');
    };

    // Prevent closing by clicking outside if no user
    const onOpenChange = (open: boolean) => {
        if (!open) {
            handleClose();
        } else {
            openAuthModal();
        }
    };

    if (loading) return null; // Or return nothing while loading

    return (
        <Dialog open={isAuthModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-3xl border border-border/80 shadow-2xl">
                <DialogHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <div className="bg-gradient-candy p-3 rounded-2xl">
                            <Heart className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="font-display text-2xl text-primary text-center">Welcome to Yadawi</DialogTitle>
                    <DialogDescription className="text-center">
                        Please sign in to continue to the magical world of plush toys.
                    </DialogDescription>
                </DialogHeader>
                <AuthForm onSuccess={() => closeAuthModal()} />
            </DialogContent>
        </Dialog>
    );
}
