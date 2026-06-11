import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useWristbandAuth, useWristbandSession } from '@wristband/react-client-auth';

import { logActivity } from '../../../services/integrityMonitoring';
import { awardXP } from '../services/xpService';
import { XP_REWARDS } from '../services/xpService';
import { supabase } from '../api/supabaseClient';
import { WristbandSessionMetadata } from '../types/session-types';
import { isAdminRole } from '../utils/auth';

// Define the shape of our Supabase context
interface SupabaseContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshAuthState: () => Promise<void>;
}

// Create the context with default values
const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refreshAuthState: async () => {},
});

// Hook for components to easily access auth context
export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  // Wristband Hooks
  const { isAuthenticated } = useWristbandAuth();
  const {
    userId: wristbandUserId,
    tenantId: wristbandTenantId,
    metadata
  } = useWristbandSession<WristbandSessionMetadata>();
  const { email: wristbandEmail, role } = metadata;

  const isAdmin = isAdminRole(role?.name || '');

  const refreshAuthState = async () => {
    if (!wristbandUserId || !wristbandTenantId) return;
    
    try {
      const user = await getOrProvisionUserByExtenalId(wristbandUserId, wristbandTenantId);
      await ensureProfileExists(user.id, wristbandEmail);
      setUser(user);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      navigate('/');
    }
  };

  useEffect(() => {
    const getSupabaseUser = async () => {
      try {
        // First make sure a Supabase<->Wristband user mapping exists
        const user = await getOrProvisionUserByExtenalId(wristbandUserId, wristbandTenantId);

        // Then make sure that Supabase user has a profile record
        await ensureProfileExists(user.id, wristbandEmail);
        setUser(user);

        // Award daily XP for all authenticated users
        checkAndAwardDailyXP(user.id);
        logActivity({ user_id: user.id, activity_type: 'login', discipline: 'hvac' });
      } catch (error) {
        console.error('[SupabaseProvider] Error getting user:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    // Only attempt to fetch Supabase user if their Wristband auth succeeded.
    if (isAuthenticated) {
      getSupabaseUser();
    } else {
      // If not authenticated after initial check, stop loading
      if (isAuthenticated === false) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Get user from Supabase using their Wristband userId
  const getOrProvisionUserByExtenalId = async (wristbandUserId: string, wristbandTenantId: string) => {
    // First check if they have a record in the "users" table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('external_id', wristbandUserId) // Column storing Wristband user ID
      .single();

    // Throw an error if any other random error occurs.
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to check user existence: ${fetchError.message}`);
    }

    // If the user alreaady exists, then simply proceed.
    if (existingUser) {
      return existingUser;
    }

    // Otherwise, we have to create the user in Supabase on the fly. This ensures that no matter
    // where/how Wristband users are created, they'll stay in sync with Supabase users.
    const newUserData = {
      external_id: wristbandUserId,
      external_tenant_id: wristbandTenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([newUserData])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return newUser;
  };

  // Users in Supabase should always have a basic profile.
  const ensureProfileExists = async (userId: string, email: string) => {
    // First check if they have a record in the "profiles" table
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Throw an error if any other random error occurs.
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to check user existence: ${fetchError.message}`);
    }

    // If the profile alreaady exists, then simply proceed.
    if (existingProfile) {
      return;
    }

    // Otherwise, we have to create the profile in Supabase on the fly. This is a replacement
    // for the Supabase "handle_new_user" function that doesn't exist anymore.
    const newProfileData = { id: userId, email, created_at: new Date().toISOString() };
    const { error: createError } = await supabase
      .from('profiles')
      .insert([newProfileData])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create profile: ${createError.message}`);
    }
  };

  // Award daily login XP if it's a new day
  const checkAndAwardDailyXP = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if XP was already awarded today
      const { data: existingLog } = await supabase
        .from('xp_activity_log')
        .select('created_at')
        .eq('user_id', userId)
        .eq('activity', 'daily_login')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (!existingLog) {
        // Award daily login XP
        await awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'daily_login');
      }
    } catch (error) {
      console.error('Error awarding daily XP:', error);
    }
  };

  return (
    <SupabaseContext.Provider value={{ user, isLoading, isAdmin, refreshAuthState }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;

