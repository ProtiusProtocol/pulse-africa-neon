import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
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

  return {
    user,
    session,
    loading,
    isAdmin,
    signOut,
  };
}