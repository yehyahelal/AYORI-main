import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'superadmin' | 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  customerSignIn: (email: string, displayName?: string) => Promise<{ error: Error | null; isNew?: boolean }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createAdminAccount: (
    email: string,
    password: string,
    displayName?: string,
    roleToAssign?: 'admin' | 'superadmin'
  ) => Promise<{ error: Error | null; user?: any }>;
  revokeAdminAccount: (targetUserId: string) => Promise<{ error: Error | null }>;
  resetAdminPasswordDefault: (targetUserId: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCachedRole = (): UserRole | null => {
  try {
    return (sessionStorage.getItem('yadawi_user_role') as UserRole) || null;
  } catch {
    return null;
  }
};

const getStoredCustomer = (): User | null => {
  try {
    const raw = localStorage.getItem('yadawi_customer_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredCustomer);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(() => {
    return getCachedRole() || (getStoredCustomer() ? 'user' : null);
  });

  const updateUserRole = (newRole: UserRole | null) => {
    setRole(newRole);
    try {
      if (newRole) {
        sessionStorage.setItem('yadawi_user_role', newRole);
      } else {
        sessionStorage.removeItem('yadawi_user_role');
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
        const hasSuperAdmin = data.some((r) => r.role === 'superadmin');
        const hasAdminRole = data.some((r) => r.role === 'admin');
        const assignedRole: UserRole = hasSuperAdmin ? 'superadmin' : hasAdminRole ? 'admin' : (data[0].role as UserRole);
        updateUserRole(assignedRole);
        return assignedRole;
      }

      if (metadataRole === 'superadmin') {
        updateUserRole('superadmin');
        return 'superadmin';
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
      if (metadataRole === 'superadmin') {
        updateUserRole('superadmin');
        return 'superadmin';
      }
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
          const stored = getStoredCustomer();
          if (stored) {
            setUser(stored);
            updateUserRole('user');
          } else {
            updateUserRole(null);
          }
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

  const getCustomerSecret = (email: string): string => {
    const clean = email.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    return `Yadawi#Customer_${Math.abs(hash)}!2026`;
  };

  const customerSignIn = async (
    email: string,
    displayName?: string
  ): Promise<{ error: Error | null; isNew?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const customerPassword = getCustomerSecret(cleanEmail);

    // 1. Try to sign in directly
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: customerPassword,
    });

    if (!signInError && signInData?.user) {
      setUser(signInData.user);
      setSession(signInData.session);
      await fetchUserRole(signInData.user.id, signInData.user);
      try {
        localStorage.removeItem('yadawi_customer_user');
      } catch {}

      // Link any previously placed guest orders with this email to this user_id
      try {
        await supabase
          .from('orders')
          .update({ user_id: signInData.user.id })
          .eq('customer_email', cleanEmail)
          .is('user_id', null);
      } catch {
        // Non-blocking
      }

      return { error: null, isNew: false };
    }

    // 2. If user doesn't exist yet with this customer password, attempt auto signup
    const redirectUrl = `${window.location.origin}/`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: customerPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || cleanEmail.split('@')[0],
          is_customer: true,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return {
          error: new Error(
            'This email is registered with a password (e.g. Admin account). Please sign in using the Admin Login.'
          ),
        };
      }
      
      // Fallback: If rate-limited or email confirmation is required by Supabase, 
      // activate instant customer session so user is NEVER blocked!
      console.warn('Activating instant email customer session:', signUpError.message);
      const fallbackUser = {
        id: `customer_${Date.now()}`,
        email: cleanEmail,
        user_metadata: {
          display_name: displayName || cleanEmail.split('@')[0],
          is_customer: true,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any;

      setUser(fallbackUser);
      updateUserRole('user');
      try {
        localStorage.setItem('yadawi_customer_user', JSON.stringify(fallbackUser));
      } catch {}

      return { error: null, isNew: true };
    }

    // Check if session was returned directly on signup
    if (signUpData?.session && signUpData?.user) {
      setUser(signUpData.user);
      setSession(signUpData.session);
      await fetchUserRole(signUpData.user.id, signUpData.user);

      try {
        await supabase
          .from('orders')
          .update({ user_id: signUpData.user.id })
          .eq('customer_email', cleanEmail)
          .is('user_id', null);
      } catch {
        // Non-blocking
      }

      return { error: null, isNew: true };
    }

    // 3. Retry signing in immediately
    const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: customerPassword,
    });

    if (retryError) {
      return { error: retryError as Error };
    }

    if (retryData?.user) {
      setUser(retryData.user);
      setSession(retryData.session);
      await fetchUserRole(retryData.user.id, retryData.user);

      try {
        await supabase
          .from('orders')
          .update({ user_id: retryData.user.id })
          .eq('customer_email', cleanEmail)
          .is('user_id', null);
      } catch {
        // Non-blocking
      }
    }

    return { error: null, isNew: true };
  };

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

  const createAdminAccount = async (
    email: string,
    password: string,
    displayName?: string,
    roleToAssign: 'admin' | 'superadmin' = 'admin'
  ): Promise<{ error: Error | null; user?: any }> => {
    if (role !== 'superadmin') {
      return { error: new Error('Only a SuperAdmin can create admin accounts.') };
    }

    try {
      // Use an isolated temporary client so current superadmin session is not replaced
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const cleanEmail = email.trim().toLowerCase();
      const name = displayName?.trim() || cleanEmail.split('@')[0];

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            display_name: name,
            role: roleToAssign,
          },
        },
      });

      if (signUpError) {
        return { error: signUpError as Error };
      }

      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        return { error: new Error('User was not created by Supabase Auth.') };
      }

      // Assign the role in public.user_roles using current superadmin permissions
      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: newUserId,
        role: roleToAssign,
        email: cleanEmail,
        display_name: name,
      });

      if (roleError) {
        console.warn('Direct user_roles upsert notice:', roleError.message);
        try {
          await (supabase as any).rpc('assign_user_role', {
            _target_user_id: newUserId,
            _role: roleToAssign,
          });
        } catch (rpcErr) {
          console.warn('RPC assign_user_role notice:', rpcErr);
        }
      }

      // Also ensure profile exists
      try {
        await supabase.from('profiles').upsert({
          user_id: newUserId,
          display_name: name,
        });
      } catch {
        // Non-blocking
      }

      return { error: null, user: signUpData.user };
    } catch (err: any) {
      return { error: err };
    }
  };

  const revokeAdminAccount = async (targetUserId: string): Promise<{ error: Error | null }> => {
    if (role !== 'superadmin') {
      return { error: new Error('Only a SuperAdmin can revoke admin roles.') };
    }

    try {
      const { error: rpcError } = await (supabase as any).rpc('revoke_admin_role', {
        _target_user_id: targetUserId,
      });

      if (rpcError) {
        const { error: delError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId)
          .eq('role', 'admin');

        if (delError) return { error: delError as Error };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetAdminPasswordDefault = async (targetUserId: string): Promise<{ error: Error | null }> => {
    if (role !== 'superadmin') {
      return { error: new Error('Only a SuperAdmin can reset admin passwords.') };
    }

    try {
      const { error } = await (supabase as any).rpc('reset_admin_password_default', {
        _target_user_id: targetUserId,
      });

      if (error) {
        return { error: new Error(error.message || 'Failed to reset password to default.') };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<{ error: Error | null }> => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const verifyRecoveryOtp = async (email: string, rawToken: string): Promise<{ error: Error | null }> => {
    try {
      let token = rawToken.trim().replace(/[\s-]/g, '');
      const cleanEmail = email.trim().toLowerCase();

      // If user pasted a full URL or query string with token_hash
      if (token.includes('token_hash=')) {
        const hashMatch = token.match(/token_hash=([^&]+)/);
        if (hashMatch) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: decodeURIComponent(hashMatch[1]),
            type: 'recovery',
          });
          if (!error && data?.user) {
            setUser(data.user);
            setSession(data.session);
            await fetchUserRole(data.user.id, data.user);
          }
          return { error: error as Error | null };
        }
      }

      // If user pasted a URL with token=
      if (token.includes('token=')) {
        const tokenMatch = token.match(/token=([^&]+)/);
        if (tokenMatch) {
          token = decodeURIComponent(tokenMatch[1]);
        }
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token,
        type: 'recovery',
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserRole(data.user.id, data.user);
      }
      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem('yadawi_customer_user');
    } catch {}
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
      isAdmin: role === 'admin' || role === 'superadmin',
      isSuperAdmin: role === 'superadmin',
      customerSignIn,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      createAdminAccount,
      revokeAdminAccount,
      resetAdminPasswordDefault,
      resetPasswordForEmail,
      verifyRecoveryOtp,
      updatePassword
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
