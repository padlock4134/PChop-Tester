import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  AuthStatus,
  redirectToLogout,
  SessionResponse,
  useWristbandAuth,
  WristbandAuthProvider
} from '@wristband/react-client-auth';
import './i18n';

import DisciplineSelector from './DisciplineSelector';
import NavBar from './disciplines/culinary/components/NavBar';
import MyKitchen from './disciplines/culinary/modules/MyKitchen';
import MyCookBook from './disciplines/culinary/modules/MyCookBook';
import ChefsCorner from './disciplines/culinary/modules/ChefsCorner';
import CulinarySchool from './disciplines/culinary/modules/CulinarySchool';
import Profile from './disciplines/culinary/components/Profile';
import Dashboard from './disciplines/culinary/components/Dashboard';
import AdminDashboard from './disciplines/culinary/components/AdminDashboard';
import ChefFreddieWidget from './disciplines/culinary/components/ChefFreddieWidget';
import { FreddieProvider } from './disciplines/culinary/components/FreddieContext';
import { RecipeProvider } from './disciplines/culinary/components/RecipeContext';
import SupabaseProvider, { useSupabase } from './disciplines/culinary/components/SupabaseProvider';
import type { WristbandSessionMetadata } from './disciplines/culinary/types/session-types';
import { setSupabaseJwt } from './disciplines/culinary/api/supabaseClient';
import { useDeviceDetect, getResponsiveClasses } from './disciplines/culinary/utils/responsiveUtils';
import InactivityWarningModal from './disciplines/culinary/components/InactivityWarningModal';
import { useAutoLogout } from './disciplines/culinary/hooks/useAutoLogout';

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
  const navigate = useNavigate();
  const { authStatus } = useWristbandAuth();
  const { user, isLoading } = useSupabase();

  useEffect(() => {
    if (isLoading) return;
    
    // If authenticated and user is loaded, go to dashboard
    if (authStatus === AuthStatus.AUTHENTICATED && user) {
      navigate('/select-discipline', { replace: true });
    } else if (authStatus === AuthStatus.UNAUTHENTICATED) {
      // Not authenticated, redirect to login
      window.location.href = '/.netlify/functions/auth-login';
    }
  }, [authStatus, user, isLoading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-sand">
      <div className="text-maineBlue text-xl">Loading...</div>
    </div>
  );
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

  // Auto-logout after 30 minutes of inactivity with 2-minute warning
  const { showWarning, countdown, stayLoggedIn, logoutNow } = useAutoLogout({
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes warning
    enabled: !!user // Only enable when user is authenticated
  });

  // Show loading for authenticated routes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to home (which will trigger login)
  if (!isLoading && !user) {
    return <Navigate to="/" replace />;
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
        <Routes>
          <Route path="/select-discipline" element={<DisciplineSelector />} />
          <Route path="/:discipline/dashboard" element={<Dashboard />} />
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
      <InactivityWarningModal
        isOpen={showWarning}
        countdown={countdown}
        onStayLoggedIn={stayLoggedIn}
        onLogout={logoutNow}
      />
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
        disableRedirectOnUnauthenticated={false}
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
