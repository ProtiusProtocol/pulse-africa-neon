import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setIsAdmin(false);
        if (!cancelled) setLoading(false);
        return;
      }

      await checkAdminRole(session.user.id);
      if (!cancelled) setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(async () => {
            if (cancelled) return;
            await checkAdminRole(session.user.id);
            if (!cancelled) setLoading(false);
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

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
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