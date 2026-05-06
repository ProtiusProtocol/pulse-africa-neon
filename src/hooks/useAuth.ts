import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  recheckAccess: () => Promise<{ isAdmin: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const checkIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async (session: Session | null) => {
      const checkId = ++checkIdRef.current;
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setIsAdmin(false);
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      const admin = await checkAdminRole(session.user.id);
      if (!cancelled && checkId === checkIdRef.current) {
        setIsAdmin(admin);
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const checkId = ++checkIdRef.current;
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(async () => {
            if (cancelled) return;
            const admin = await checkAdminRole(session.user.id);
            if (!cancelled && checkId === checkIdRef.current) {
              setIsAdmin(admin);
              setLoading(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => verifySession(session));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });

    if (!error) {
      return Boolean(data);
    }

    const { data: ownRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    return ownRole?.role === 'admin';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const recheckAccess = async () => {
    const checkId = ++checkIdRef.current;
    setLoading(true);
    try {
      // Force a fresh JWT so updated role/email claims are present
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      const activeSession = refreshed?.session ?? (await supabase.auth.getSession()).data.session;

      if (refreshError && !activeSession) {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        return { isAdmin: false, error: refreshError.message };
      }

      setSession(activeSession ?? null);
      setUser(activeSession?.user ?? null);

      if (!activeSession?.user) {
        setIsAdmin(false);
        return { isAdmin: false, error: "Not signed in" };
      }

      const admin = await checkAdminRole(activeSession.user.id);
      if (checkId === checkIdRef.current) setIsAdmin(admin);
      return { isAdmin: admin };
    } finally {
      if (checkId === checkIdRef.current) setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isAdmin,
    signOut,
    recheckAccess,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}