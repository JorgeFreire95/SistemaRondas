import React, { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../config/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Unique ID for this device session
  const [sessionId] = useState(() => {
    let sid = sessionStorage.getItem('rondas_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('rondas_session_id', sid);
    }
    return sid;
  });

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user.id);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (error || !data) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Conflict detection: if someone else logged in
      if (data.active_session_id && data.active_session_id !== sessionId) {
        alert("Se ha iniciado sesión en otro dispositivo. Se cerrará esta sesión.");
        logout();
        return;
      }

      setUser({
        id: uid,
        email: data.email,
        name: data.name,
        role: data.role,
        rut: data.rut,
        dv: data.dv,
        address: data.address,
        assignedInstallationId: data.assigned_installation_id,
        assignedSectionId: data.assigned_section_id,
        activeRoundId: data.active_round_id,
        activeSessionId: data.active_session_id,
        currentLat: data.current_lat,
        currentLng: data.current_lng,
      });
      setLoading(false);
    } catch (e) {
      console.error("Error fetching user profile:", e);
      setUser(null);
      setLoading(false);
    }
  };

  // Realtime subscription to user profile changes
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('user-profile')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${session.user.id}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          logout();
          return;
        }
        const data = payload.new;
        if (data.active_session_id && data.active_session_id !== sessionId) {
          alert("Se ha iniciado sesión en otro dispositivo. Se cerrará esta sesión.");
          logout();
          return;
        }
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          rut: data.rut,
          dv: data.dv,
          address: data.address,
          assignedInstallationId: data.assigned_installation_id,
          assignedSectionId: data.assigned_section_id,
          activeRoundId: data.active_round_id,
          activeSessionId: data.active_session_id,
          currentLat: data.current_lat,
          currentLng: data.current_lng,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = "Usuario o contraseña incorrectos. Si acabas de crear el usuario, asegúrate de haber desactivado la opción 'Confirm Email' en el Dashboard de Supabase.";
        }
        return { success: false, message: msg };
      }

      // Set active session
      await supabase
        .from('users')
        .update({ active_session_id: sessionId })
        .eq('id', data.user.id);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Error al iniciar sesión" };
    }
  };

  const logout = async () => {
    try {
      if (session?.user) {
        await supabase
          .from('users')
          .update({ active_session_id: null })
          .eq('id', session.user.id);
      }
    } catch (e) {
      console.error("Error clearing session on logout:", e);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const addUser = async (email, password, name, role, extraData = {}) => {
    try {
      // Create a temporary client that does NOT persist session
      // to avoid signing out the current admin
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error } = await tempSupabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { 
            name, 
            role,
            rut: extraData.rut,
            dv: extraData.dv
          }
        }
      });

      if (error) {
        // If user already exists in Auth but not in public.users, we should still try to create the profile
        if (error.message.includes('already registered')) {
          // Attempt self-healing: try to log in the temp client with the provided password
          // If it works, we get the UID and can fix the profile!
          const { data: signInData, error: signInError } = await tempSupabase.auth.signInWithPassword({
            email,
            password
          });

          if (!signInError && signInData?.user?.id) {
            console.log("Self-healing: User found in Auth, syncing profile...");
            // Proceed to upsert with the retrieved ID
            const { error: syncError } = await supabase
              .from('users')
              .upsert({
                id: signInData.user.id,
                email,
                name,
                role,
                rut: extraData.rut || null,
                dv: extraData.dv || null,
                address: extraData.address || null,
                assigned_installation_id: extraData.assignedInstallationId || null,
                assigned_section_id: extraData.assignedSectionId || null,
              }, { onConflict: 'id' });

            if (!syncError) {
              return { success: true, message: "Usuario sincronizado correctamente (ya existía en la base de datos de autenticación)." };
            }
          }

          return { 
            success: false, 
            message: "Este usuario ya existe en el sistema de autenticación pero tiene una contraseña diferente (posiblemente la anterior con puntos/guiones). Para arreglarlo, bórralo de la pestaña 'Authentication' en el Dashboard de Supabase y créalo de nuevo aquí."
          };
        }
        return { success: false, message: error.message };
      }

      if (!data?.user?.id) {
        return { success: false, message: "No se pudo obtener el ID del usuario creado." };
      }

      // Profile is handled by database trigger + this upsert
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email,
          name,
          role,
          rut: extraData.rut || null,
          dv: extraData.dv || null,
          address: extraData.address || null,
          assigned_installation_id: extraData.assignedInstallationId || null,
          assigned_section_id: extraData.assignedSectionId || null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        return { success: false, message: "Error al crear perfil en la base de datos: " + profileError.message };
      }

      // Sign back in as the original admin (the signup above may have changed the session)
      // We need to re-authenticate. The admin should still have their session from the cookie.
      // In Supabase, signUp with autoconfirm off won't change the current session.
      // If autoconfirm is on, we need to sign the admin back in.
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
