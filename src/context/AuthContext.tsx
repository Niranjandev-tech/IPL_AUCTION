import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/auction.types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signInAsGuest: (displayName: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    // Check saved guest user in localStorage
    const saved = localStorage.getItem('ipl_auction_guest_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser(data);
      } else {
        const newProfile: Profile = {
          id: userId,
          email,
          display_name: email.split('@')[0],
          created_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(newProfile);
        setUser(newProfile);
      }
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      signInAsGuest('Google User');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.warn('Supabase OAuth error, fallback to guest:', error);
        signInAsGuest('Google User');
      }
    } catch (err) {
      console.warn('OAuth redirect failed:', err);
      signInAsGuest('Google User');
    }
  };

  const signInWithEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!isSupabaseConfigured) {
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      signInAsGuest(displayName);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        console.warn('Supabase OTP error, logging in with email:', error);
        const name = email.split('@')[0];
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        signInAsGuest(displayName);
      }
    } catch (err) {
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      signInAsGuest(displayName);
    }
  };

  const signInAsGuest = (displayName: string) => {
    const guestUser: Profile = {
      id: `guest-${Math.random().toString(36).substring(2, 9)}`,
      email: `${displayName.toLowerCase().replace(/\s+/g, '')}@guest.local`,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };
    setUser(guestUser);
    localStorage.setItem('ipl_auction_guest_user', JSON.stringify(guestUser));
    setLoading(false);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('ipl_auction_guest_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
