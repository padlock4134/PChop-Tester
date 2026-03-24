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
import { DisciplineProvider, useDiscipline } from './DisciplineContext';
import { getDisciplineFromPath, isCustomDiscipline } from './disciplineConfig';

import DisciplineSelector from './DisciplineSelector';
// Culinary imports
import CulinaryNavBar from './disciplines/culinary/components/NavBar';
import CulinaryMyKitchen from './disciplines/culinary/modules/MyKitchen';
import CulinaryMyCookBook from './disciplines/culinary/modules/MyCookBook';
import CulinaryChefsCorner from './disciplines/culinary/modules/ChefsCorner';
import CulinaryCulinarySchool from './disciplines/culinary/modules/CulinarySchool';
import CulinaryProfile from './disciplines/culinary/components/Profile';
import CulinaryDashboard from './disciplines/culinary/components/Dashboard';
import CulinaryChefFreddieWidget from './disciplines/culinary/components/ChefFreddieWidget';

// Plumbing imports
import PlumbingNavBar from './disciplines/plumbing/components/NavBar';
import PlumbingMyVan from './disciplines/plumbing/modules/MyVan';
import PlumbingMyPipeBook from './disciplines/plumbing/modules/MyPipeBook';
import PlumbingPipeLounge from './disciplines/plumbing/modules/PipeLounge';
import PlumbingPlumbingSchool from './disciplines/plumbing/modules/PlumbingSchool';
import PlumbingProfile from './disciplines/plumbing/components/Profile';
import PlumbingVanDashboard from './disciplines/plumbing/components/VanDashboard';
import PlumbingPipeFreddieWidget from './disciplines/plumbing/modules/PipeFreddieWidget';

// Automotive imports
import AutomotiveNavBar from './disciplines/automotive/components/NavBar';
import AutomotiveMyGarage from './disciplines/automotive/modules/MyGarage';
import AutomotiveMyManual from './disciplines/automotive/modules/MyManual';
import AutomotiveGearheadLounge from './disciplines/automotive/modules/GearheadLounge';
import AutomotiveAutoSchool from './disciplines/automotive/modules/AutoSchool';
import AutomotiveProfile from './disciplines/automotive/components/Profile';
import AutomotiveGarageDashboard from './disciplines/automotive/components/GarageDashboard';
import AutomotiveGarageFreddieWidget from './disciplines/automotive/modules/GarageFreddieWidget';

// Construction imports
import ConstructionNavBar from './disciplines/construction/components/NavBar';
import ConstructionMySite from './disciplines/construction/modules/MySite';
import ConstructionMyBlueprints from './disciplines/construction/modules/MyBlueprints';
import ConstructionHardhatHub from './disciplines/construction/modules/HardhatHub';
import ConstructionBuildSchool from './disciplines/construction/modules/BuildSchool';
import ConstructionProfile from './disciplines/construction/components/Profile';
import ConstructionSiteDashboard from './disciplines/construction/components/SiteDashboard';
import ConstructionSiteFreddieWidget from './disciplines/construction/modules/SiteFreddieWidget';

// Electrical imports
import ElectricalNavBar from './disciplines/electrical/components/NavBar';
import ElectricalMyPanel from './disciplines/electrical/modules/MyPanel';
import ElectricalMyCodeBook from './disciplines/electrical/modules/MyCodeBook';
import ElectricalWireLounge from './disciplines/electrical/modules/WireLounge';
import ElectricalElecSchool from './disciplines/electrical/modules/ElecSchool';
import ElectricalProfile from './disciplines/electrical/components/Profile';
import ElectricalPanelDashboard from './disciplines/electrical/components/PanelDashboard';
import ElectricalSparkFreddieWidget from './disciplines/electrical/modules/SparkFreddieWidget';

// HVAC imports
import HvacNavBar from './disciplines/hvac/components/NavBar';
import HvacMyShop from './disciplines/hvac/modules/MyShop';
import HvacMySpecSheets from './disciplines/hvac/modules/MySpecSheets';
import HvacTechTalk from './disciplines/hvac/modules/TechTalk';
import HvacHvacSchool from './disciplines/hvac/modules/HvacSchool';
import HvacProfile from './disciplines/hvac/components/Profile';
import HvacShopDashboard from './disciplines/hvac/components/ShopDashboard';
import HvacShopFreddieWidget from './disciplines/hvac/modules/ShopFreddieWidget';

// Manufacturing imports
import ManufacturingNavBar from './disciplines/manufacturing/components/NavBar';
import ManufacturingMyFloor from './disciplines/manufacturing/modules/MyFloor';
import ManufacturingMyPlaybook from './disciplines/manufacturing/modules/MyPlaybook';
import ManufacturingShopTalk from './disciplines/manufacturing/modules/ShopTalk';
import ManufacturingMfgAcademy from './disciplines/manufacturing/modules/MfgAcademy';
import ManufacturingProfile from './disciplines/manufacturing/components/Profile';
import ManufacturingFloorDashboard from './disciplines/manufacturing/components/FloorDashboard';
import ManufacturingFloorFreddieWidget from './disciplines/manufacturing/modules/FloorFreddieWidget';

// Logistics imports
import LogisticsNavBar from './disciplines/logistics/components/NavBar';
import LogisticsMyDock from './disciplines/logistics/modules/MyDock';
import LogisticsMyRunbook from './disciplines/logistics/modules/MyRunbook';
import LogisticsDispatchLounge from './disciplines/logistics/modules/DispatchLounge';
import LogisticsLogisticsSchool from './disciplines/logistics/modules/LogisticsSchool';
import LogisticsProfile from './disciplines/logistics/components/Profile';
import LogisticsDockDashboard from './disciplines/logistics/components/DockDashboard';
import LogisticsDockFreddieWidget from './disciplines/logistics/modules/DockFreddieWidget';

// Machining imports
import MachiningNavBar from './disciplines/machining/components/NavBar';
import MachiningMyBench from './disciplines/machining/modules/MyBench';
import MachiningMySpecBook from './disciplines/machining/modules/MySpecBook';
import MachiningMachinistCorner from './disciplines/machining/modules/MachinistCorner';
import MachiningMachiningSchool from './disciplines/machining/modules/MachiningSchool';
import MachiningProfile from './disciplines/machining/components/Profile';
import MachiningBenchDashboard from './disciplines/machining/components/BenchDashboard';
import MachiningBenchFreddieWidget from './disciplines/machining/modules/BenchFreddieWidget';
import { FreddieProvider } from './disciplines/culinary/components/FreddieContext';
import { RecipeProvider } from './disciplines/culinary/components/RecipeContext';
import SupabaseProvider, { useSupabase } from './disciplines/culinary/components/SupabaseProvider';
import type { WristbandSessionMetadata } from './disciplines/culinary/types/session-types';
import { setSupabaseJwt } from './disciplines/culinary/api/supabaseClient';
import { useDeviceDetect, getResponsiveClasses } from './disciplines/culinary/utils/responsiveUtils';
import InactivityWarningModal from './disciplines/culinary/components/InactivityWarningModal';
import { useAutoLogout } from './disciplines/culinary/hooks/useAutoLogout';
import UnifiedAdminDashboard from './components/UnifiedAdminDashboard';

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
  const location = useLocation();
  const { authStatus } = useWristbandAuth();
  const { user, isLoading, isAdmin } = useSupabase();

  useEffect(() => {
    if (isLoading) return;
    
    // If authenticated and user is loaded, preserve current page or redirect appropriately
    if (authStatus === AuthStatus.AUTHENTICATED && user) {
      // If user is on the root path, ALWAYS redirect to discipline selector first
      if (location.pathname === '/' || location.pathname === '') {
        // Check if user has a preferred page stored (but discipline selector takes priority)
        const lastPage = localStorage.getItem('lastPage');
        if (lastPage && lastPage !== '/' && lastPage !== '' && lastPage !== '/select-discipline') {
          // Save the intended destination for after discipline selection
          localStorage.setItem('intendedDestination', lastPage);
        }
        // ALWAYS go to discipline selector first, regardless of admin status
        navigate('/select-discipline', { replace: true });
      }
      // If user is already on a specific page, don't redirect - let them stay there
    } else if (authStatus === AuthStatus.UNAUTHENTICATED) {
      // Not authenticated, redirect to login
      window.location.href = '/.netlify/functions/auth-login';
    }
  }, [authStatus, user, isLoading, navigate, location.pathname, isAdmin]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-sand">
      <div className="text-maineBlue text-xl">Loading...</div>
    </div>
  );
};

// Component mapping for dynamic routing
const getDisciplineComponents = (discipline: string) => {
  const componentMap: Record<string, any> = {
    culinary: {
      NavBar: CulinaryNavBar,
      Kitchen: CulinaryMyKitchen,
      Cookbook: CulinaryMyCookBook,
      Corner: CulinaryChefsCorner,
      School: CulinaryCulinarySchool,
      Profile: CulinaryProfile,
      Dashboard: CulinaryDashboard,
      FreddieWidget: CulinaryChefFreddieWidget
    },
    plumbing: {
      NavBar: PlumbingNavBar,
      Kitchen: PlumbingMyVan,
      Cookbook: PlumbingMyPipeBook,
      Corner: PlumbingPipeLounge,
      School: PlumbingPlumbingSchool,
      Profile: PlumbingProfile,
      Dashboard: PlumbingVanDashboard,
      FreddieWidget: PlumbingPipeFreddieWidget
    },
    automotive: {
      NavBar: AutomotiveNavBar,
      Kitchen: AutomotiveMyGarage,
      Cookbook: AutomotiveMyManual,
      Corner: AutomotiveGearheadLounge,
      School: AutomotiveAutoSchool,
      Profile: AutomotiveProfile,
      Dashboard: AutomotiveGarageDashboard,
      FreddieWidget: AutomotiveGarageFreddieWidget
    },
    construction: {
      NavBar: ConstructionNavBar,
      Kitchen: ConstructionMySite,
      Cookbook: ConstructionMyBlueprints,
      Corner: ConstructionHardhatHub,
      School: ConstructionBuildSchool,
      Profile: ConstructionProfile,
      Dashboard: ConstructionSiteDashboard,
      FreddieWidget: ConstructionSiteFreddieWidget
    },
    electrical: {
      NavBar: ElectricalNavBar,
      Kitchen: ElectricalMyPanel,
      Cookbook: ElectricalMyCodeBook,
      Corner: ElectricalWireLounge,
      School: ElectricalElecSchool,
      Profile: ElectricalProfile,
      Dashboard: ElectricalPanelDashboard,
      FreddieWidget: ElectricalSparkFreddieWidget
    },
    hvac: {
      NavBar: HvacNavBar,
      Kitchen: HvacMyShop,
      Cookbook: HvacMySpecSheets,
      Corner: HvacTechTalk,
      School: HvacHvacSchool,
      Profile: HvacProfile,
      Dashboard: HvacShopDashboard,
      FreddieWidget: HvacShopFreddieWidget
    },
    manufacturing: {
      NavBar: ManufacturingNavBar,
      Kitchen: ManufacturingMyFloor,
      Cookbook: ManufacturingMyPlaybook,
      Corner: ManufacturingShopTalk,
      School: ManufacturingMfgAcademy,
      Profile: ManufacturingProfile,
      Dashboard: ManufacturingFloorDashboard,
      FreddieWidget: ManufacturingFloorFreddieWidget
    },
    logistics: {
      NavBar: LogisticsNavBar,
      Kitchen: LogisticsMyDock,
      Cookbook: LogisticsMyRunbook,
      Corner: LogisticsDispatchLounge,
      School: LogisticsLogisticsSchool,
      Profile: LogisticsProfile,
      Dashboard: LogisticsDockDashboard,
      FreddieWidget: LogisticsDockFreddieWidget
    },
    machining: {
      NavBar: MachiningNavBar,
      Kitchen: MachiningMyBench,
      Cookbook: MachiningMySpecBook,
      Corner: MachiningMachinistCorner,
      School: MachiningMachiningSchool,
      Profile: MachiningProfile,
      Dashboard: MachiningBenchDashboard,
      FreddieWidget: MachiningBenchFreddieWidget
    }
  };
  
  // Custom disciplines use culinary components
  if (isCustomDiscipline(discipline)) {
    return componentMap.culinary;
  }
  
  return componentMap[discipline] || componentMap.culinary;
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { authStatus } = useWristbandAuth();
  const { user, isLoading, refreshAuthState } = useSupabase();
  const { isAdminMode } = useAdminToggle();
  
  // Save current page to localStorage for persistence on refresh
  useEffect(() => {
    if (user && location.pathname !== '/' && location.pathname !== '') {
      localStorage.setItem('lastPage', location.pathname);
      
      // Clear any intended destination if user navigates directly to a discipline page
      if (location.pathname !== '/select-discipline' && location.pathname !== '/admin') {
        localStorage.removeItem('intendedDestination');
      }
    }
  }, [location.pathname, user]);
  
  // Get current discipline from path
  const currentDiscipline = getDisciplineFromPath(location.pathname) || 'culinary';
  const components = getDisciplineComponents(currentDiscipline);
  
  const NavBar = components.NavBar;
  const Dashboard = components.Dashboard;
  const FreddieWidget = components.FreddieWidget;
  
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


  const isDisciplineSelect = location.pathname === '/select-discipline';
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-sand">
      {!isDisciplineSelect && <NavBar />}
      <main className={`${responsiveClasses} max-w-5xl mx-auto px-4 pt-4 pb-8`}>
        <Routes>
          <Route path="/select-discipline" element={<DisciplineSelector />} />
          <Route path="/admin" element={<UnifiedAdminDashboard />} />
          
          {/* Culinary routes */}
          <Route path="/culinary/dashboard" element={<CulinaryDashboard />} />
          <Route path="/culinary/my-kitchen" element={<CulinaryMyKitchen />} />
          <Route path="/culinary/my-cookbook" element={<CulinaryMyCookBook />} />
          <Route path="/culinary/chefs-corner" element={<CulinaryChefsCorner />} />
          <Route path="/culinary/culinary-school" element={<CulinaryCulinarySchool />} />
          <Route path="/culinary/profile" element={<CulinaryProfile />} />
          
          {/* Plumbing routes */}
          <Route path="/plumbing/dashboard" element={<PlumbingVanDashboard />} />
          <Route path="/plumbing/my-van" element={<PlumbingMyVan />} />
          <Route path="/plumbing/my-pipebook" element={<PlumbingMyPipeBook />} />
          <Route path="/plumbing/pipe-lounge" element={<PlumbingPipeLounge />} />
          <Route path="/plumbing/plumbing-school" element={<PlumbingPlumbingSchool />} />
          <Route path="/plumbing/profile" element={<PlumbingProfile />} />
          
          {/* Automotive routes */}
          <Route path="/automotive/dashboard" element={<AutomotiveGarageDashboard />} />
          <Route path="/automotive/my-garage" element={<AutomotiveMyGarage />} />
          <Route path="/automotive/my-manual" element={<AutomotiveMyManual />} />
          <Route path="/automotive/gearhead-lounge" element={<AutomotiveGearheadLounge />} />
          <Route path="/automotive/auto-school" element={<AutomotiveAutoSchool />} />
          <Route path="/automotive/profile" element={<AutomotiveProfile />} />
          
          {/* Construction routes */}
          <Route path="/construction/dashboard" element={<ConstructionSiteDashboard />} />
          <Route path="/construction/my-site" element={<ConstructionMySite />} />
          <Route path="/construction/my-blueprints" element={<ConstructionMyBlueprints />} />
          <Route path="/construction/hardhat-hub" element={<ConstructionHardhatHub />} />
          <Route path="/construction/build-school" element={<ConstructionBuildSchool />} />
          <Route path="/construction/profile" element={<ConstructionProfile />} />
          
          {/* Electrical routes */}
          <Route path="/electrical/dashboard" element={<ElectricalPanelDashboard />} />
          <Route path="/electrical/my-panel" element={<ElectricalMyPanel />} />
          <Route path="/electrical/my-codebook" element={<ElectricalMyCodeBook />} />
          <Route path="/electrical/wire-lounge" element={<ElectricalWireLounge />} />
          <Route path="/electrical/elec-school" element={<ElectricalElecSchool />} />
          <Route path="/electrical/profile" element={<ElectricalProfile />} />
          
          {/* HVAC routes */}
          <Route path="/hvac/dashboard" element={<HvacShopDashboard />} />
          <Route path="/hvac/my-shop" element={<HvacMyShop />} />
          <Route path="/hvac/my-specsheets" element={<HvacMySpecSheets />} />
          <Route path="/hvac/tech-talk" element={<HvacTechTalk />} />
          <Route path="/hvac/hvac-school" element={<HvacHvacSchool />} />
          <Route path="/hvac/profile" element={<HvacProfile />} />
          
          {/* Manufacturing routes */}
          <Route path="/manufacturing/dashboard" element={<ManufacturingFloorDashboard />} />
          <Route path="/manufacturing/my-floor" element={<ManufacturingMyFloor />} />
          <Route path="/manufacturing/my-playbook" element={<ManufacturingMyPlaybook />} />
          <Route path="/manufacturing/shop-talk" element={<ManufacturingShopTalk />} />
          <Route path="/manufacturing/mfg-academy" element={<ManufacturingMfgAcademy />} />
          <Route path="/manufacturing/profile" element={<ManufacturingProfile />} />
          
          {/* Logistics routes */}
          <Route path="/logistics/dashboard" element={<LogisticsDockDashboard />} />
          <Route path="/logistics/my-dock" element={<LogisticsMyDock />} />
          <Route path="/logistics/my-runbook" element={<LogisticsMyRunbook />} />
          <Route path="/logistics/dispatch-lounge" element={<LogisticsDispatchLounge />} />
          <Route path="/logistics/logistics-school" element={<LogisticsLogisticsSchool />} />
          <Route path="/logistics/profile" element={<LogisticsProfile />} />
          
          {/* Machining routes */}
          <Route path="/machining/dashboard" element={<MachiningBenchDashboard />} />
          <Route path="/machining/my-bench" element={<MachiningMyBench />} />
          <Route path="/machining/my-specbook" element={<MachiningMySpecBook />} />
          <Route path="/machining/machinist-corner" element={<MachiningMachinistCorner />} />
          <Route path="/machining/machining-school" element={<MachiningMachiningSchool />} />
          <Route path="/machining/profile" element={<MachiningProfile />} />
          
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </main>
      {!isDisciplineSelect && !isAdminRoute && <FreddieWidget />}
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
              <DisciplineProvider>
                <AppRoutes />
              </DisciplineProvider>
            </FreddieProvider>
          </RecipeProvider>
        </SupabaseProvider>
      </WristbandAuthProvider>
    </AdminToggleProvider>
  );
};

export default App;
