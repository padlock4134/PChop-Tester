import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  AuthStatus,
  redirectToLogout,
  SessionResponse,
  useWristbandAuth,
  WristbandAuthProvider
} from '@wristband/react-client-auth';

import NavBar from './components/NavBar';
import MyKitchen from './modules/MyKitchen';
import MyCookBook from './modules/MyCookBook';
import ChefsCorner from './modules/ChefsCorner';
import CulinarySchool from './modules/CulinarySchool';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ChefFreddieWidget from './components/ChefFreddieWidget';
import { FreddieProvider } from './components/FreddieContext';
import { RecipeProvider } from './components/RecipeContext';
import SupabaseProvider, { useSupabase } from './components/SupabaseProvider';
import type { WristbandSessionMetadata } from './types/session-types';
import { setSupabaseJwt } from './api/supabaseClient';
import { useDeviceDetect, getResponsiveClasses } from './utils/responsiveUtils';
import SwoopyArrow from './components/SwoopyArrow';

// Admin toggle context
const AdminToggleContext = createContext<{ isAdminMode: boolean; toggleAdminMode: () => void }>({ 
  isAdminMode: false, 
  toggleAdminMode: () => {} 
});
export const useAdminToggle = () => useContext(AdminToggleContext);

// Admin Toggle Provider Component
const AdminToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };
  
  return (
    <AdminToggleContext.Provider value={{ isAdminMode, toggleAdminMode }}>
      {children}
    </AdminToggleContext.Provider>
  );
};

const HomeRedirect = () => {
  const { authStatus } = useWristbandAuth();
  
  if (authStatus === AuthStatus.AUTHENTICATED) {
    return <Navigate to="/dashboard" replace />;
  }
  
  window.location.href = '/.netlify/functions/auth-login';
  return null;
};

const AppRoutes = () => {
  const location = useLocation();

  const navigate = useNavigate();

  const { authStatus } = useWristbandAuth();
  const { user, isLoading, refreshAuthState } = useSupabase();
  const { isAdminMode } = useAdminToggle();
  
  // Use the device detection hook
  const { deviceType } = useDeviceDetect();
  
  // Get responsive classes based on device type
  const responsiveClasses = getResponsiveClasses(deviceType);


  // We have this check here because the SupabaseProvider isLoading flag will never flip to false
  // in the event the initial Wristband auth session check fails. This status gets set to UNAUTHENTICATED
  // just once upfront right after the auth isLoading is set to false.
  useEffect(() => {
    if (authStatus === AuthStatus.UNAUTHENTICATED) {
      navigate('/');
    }
  }, [authStatus, navigate]);

  // Show loading for authenticated routes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect immediately
  if (!isLoading && !user) {
    navigate('/');
    return null;
  }


  // If admin mode is enabled and user is authenticated, show admin dashboard
  if (isAdminMode && user) {
    return (
      <div className="min-h-screen bg-sand">
        <NavBar />
        <main className={`${responsiveClasses} max-w-5xl mx-auto px-4 pt-4 pb-8`}>
          <AdminDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <NavBar />
      <main className={`${responsiveClasses} max-w-5xl mx-auto px-4 pt-4 pb-8`}>
        {location.pathname !== '/dashboard' && <SwoopyArrow />}
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-kitchen" element={<MyKitchen />} />
          <Route path="/my-cookbook" element={<MyCookBook />} />
          <Route path="/chefs-corner" element={<ChefsCorner />} />
          <Route path="/culinary-school" element={<CulinarySchool />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </main>
      <ChefFreddieWidget />
    </div>
  );
};

const App = () => {
  // Add meta viewport tag to ensure proper scaling on mobile devices
  useEffect(() => {
    // Check if the viewport meta tag exists
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // If it doesn't exist, create it
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    // Set the content attribute for proper mobile scaling
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }, []);

  return (
    <AdminToggleProvider>
      <WristbandAuthProvider<WristbandSessionMetadata>
        loginUrl='/.netlify/functions/auth-login'
        logoutUrl='/.netlify/functions/auth-logout'
        sessionUrl='/.netlify/functions/auth-session'
        disableRedirectOnUnauthenticated={true}
        onSessionSuccess={(sessionResponse: SessionResponse) => {
          // Before isAuthenticated is set to true, set the Supabase token in the client
          // so it can be used for all authenticated Supabase requests.
          const { metadata } = sessionResponse;
          const { supabaseToken } = metadata as WristbandSessionMetadata;
          setSupabaseJwt(supabaseToken);
        }}
      >
        <SupabaseProvider>
          <RecipeProvider>
            <FreddieProvider>
              <AppRoutes />
            </FreddieProvider>
          </RecipeProvider>
        </SupabaseProvider>
      </WristbandAuthProvider>
    </AdminToggleProvider>
  );
};

export default App;
