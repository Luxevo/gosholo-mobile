import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';

type AuthEventCallback = (event: AuthChangeEvent, user: User | null) => void;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** Subscribe to auth events — returns an unsubscribe function */
  onAuthEvent: (callback: AuthEventCallback) => () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Internal listener registry so child contexts can react to auth events
  // without creating their own onAuthStateChange subscriptions
  const listenersRef = useRef(new Set<AuthEventCallback>());

  const onAuthEvent = useCallback((cb: AuthEventCallback) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    // 1. Get initial session (one call for the entire app)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // 2. Single onAuthStateChange subscription for the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Fan out to all registered listeners
        listenersRef.current.forEach(cb => cb(event, newSession?.user ?? null));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    isAuthenticated: !!user,
    loading,
    onAuthEvent,
  }), [user, session, loading, onAuthEvent]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
