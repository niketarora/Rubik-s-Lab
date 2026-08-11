import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch role and details from profiles
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[AUTH] Failed to fetch profile:', error.message);
      }

      const mergedUser = {
        id: authUser.id,
        email: authUser.email,
        name: (profile && profile.display_name) || authUser.user_metadata?.display_name || authUser.email.split('@')[0],
        role: (profile && profile.role) || 'user',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        created_at: authUser.created_at
      };

      setUser(mergedUser);
    } catch (err) {
      console.error('[AUTH] Profile fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  // Restore session and listen for auth state changes
  useEffect(() => {
    setLoading(true);
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  };

  const signUp = async (name, email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name
        }
      }
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    if (error) throw error;
  };

  // Keep switcher override for UI layout checks
  const setMockRole = async (role) => {
    if (user) {
      const updated = { ...user, role: role.toLowerCase() };
      setUser(updated);
      
      // Attempt to update database as well if authenticated
      await supabase
        .from('profiles')
        .update({ role: role.toLowerCase() })
        .eq('id', user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, setMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
