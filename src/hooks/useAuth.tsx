import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCachedRole = (): UserRole | null => {
  try {
    return (sessionStorage.getItem('ayori_user_role') as UserRole) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(getCachedRole);

  const updateUserRole = (newRole: UserRole | null) => {
    setRole(newRole);
    try {
      if (newRole) {
        sessionStorage.setItem('ayori_user_role', newRole);
      } else {
        sessionStorage.removeItem('ayori_user_role');
      }
    } catch {
      // Ignore storage errors
    }
  };

  const fetchUserRole = async (userId: string, currentUser?: User | null) => {
    // Check fallback metadata first
    const userObj = currentUser || user;
    const metadataRole = userObj?.app_metadata?.role || userObj?.user_metadata?.role;

    try {
      const fetchPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Role fetch timed out') }), 3500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && data && data.length > 0) {
        const hasAdminRole = data.some((r) => r.role === 'admin');
        const assignedRole: UserRole = hasAdminRole ? 'admin' : (data[0].role as UserRole);
        updateUserRole(assignedRole);
        return assignedRole;
      }

      if (metadataRole === 'admin') {
        updateUserRole('admin');
        return 'admin';
      }

      // If we already have a cached role in sessionStorage, keep it
      const currentCached = getCachedRole();
      if (currentCached) {
        return currentCached;
      }

      updateUserRole('user');
      return 'user';
    } catch (err) {
      console.error('Error fetching user role:', err);
      if (metadataRole === 'admin') {
        updateUserRole('admin');
        return 'admin';
      }
      const currentCached = getCachedRole();
      if (currentCached) {
        return currentCached;
      }
      updateUserRole('user');
      return 'user';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Use onAuthStateChange as the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          updateUserRole(null);
          setLoading(false);
          return;
        }

        // Defer database query to next tick to avoid deadlocking with Supabase internal auth lock
        setTimeout(async () => {
          if (!isMounted) return;
          await fetchUserRole(currentUser.id, currentUser);
        }, 0);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error: error as Error | null };
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    updateUserRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      role,
      isAdmin: role === 'admin',
      signUp,
      signIn,
      signInWithOAuth,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
