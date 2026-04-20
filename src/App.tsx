import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
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
import PlumbingPipeFreddieWidget from './disciplines/plumbing/components/PipeFreddieWidget';

// Automotive imports
import AutomotiveNavBar from './disciplines/automotive/components/NavBar';
import AutomotiveMyGarage from './disciplines/automotive/modules/MyGarage';
import AutomotiveMyManual from './disciplines/automotive/modules/MyManual';
import AutomotiveGearheadLounge from './disciplines/automotive/modules/GearheadLounge';
import AutomotiveAutoSchool from './disciplines/automotive/modules/AutoSchool';
import AutomotiveProfile from './disciplines/automotive/components/Profile';
import AutomotiveGarageDashboard from './disciplines/automotive/components/GarageDashboard';
import AutomotiveGarageFreddieWidget from './disciplines/automotive/components/GarageFreddieWidget';

// Construction imports
import ConstructionNavBar from './disciplines/construction/components/NavBar';
import ConstructionMySite from './disciplines/construction/modules/MySite';
import ConstructionMyBlueprints from './disciplines/construction/modules/MyBlueprints';
import ConstructionHardhatHub from './disciplines/construction/modules/HardhatHub';
import ConstructionBuildSchool from './disciplines/construction/modules/BuildSchool';
import ConstructionProfile from './disciplines/construction/components/Profile';
import ConstructionSiteDashboard from './disciplines/construction/components/SiteDashboard';
import ConstructionSiteFreddieWidget from './disciplines/construction/components/SiteFreddieWidget';

// Electrical imports
import ElectricalNavBar from './disciplines/electrical/components/NavBar';
import ElectricalMyPanel from './disciplines/electrical/modules/MyPanel';
import ElectricalMyCodeBook from './disciplines/electrical/modules/MyCodeBook';
import ElectricalWireLounge from './disciplines/electrical/modules/WireLounge';
import ElectricalElecSchool from './disciplines/electrical/modules/ElecSchool';
import ElectricalProfile from './disciplines/electrical/components/Profile';
import ElectricalPanelDashboard from './disciplines/electrical/components/PanelDashboard';
import ElectricalSparkFreddieWidget from './disciplines/electrical/components/SparkFreddieWidget';

// HVAC imports
import HvacNavBar from './disciplines/hvac/components/NavBar';
import HvacMyShop from './disciplines/hvac/modules/MyShop';
import HvacMySpecSheets from './disciplines/hvac/modules/MySpecSheets';
import HvacTechTalk from './disciplines/hvac/modules/TechTalk';
import HvacHvacSchool from './disciplines/hvac/modules/HvacSchool';
import HvacProfile from './disciplines/hvac/components/Profile';
import HvacShopDashboard from './disciplines/hvac/components/ShopDashboard';
import HvacShopFreddieWidget from './disciplines/hvac/components/ShopFreddieWidget';

// Manufacturing imports
import ManufacturingNavBar from './disciplines/manufacturing/components/NavBar';
import ManufacturingMyFloor from './disciplines/manufacturing/modules/MyFloor';
import ManufacturingMyPlaybook from './disciplines/manufacturing/modules/MyPlaybook';
import ManufacturingShopTalk from './disciplines/manufacturing/modules/ShopTalk';
import ManufacturingMfgAcademy from './disciplines/manufacturing/modules/MfgAcademy';
import ManufacturingProfile from './disciplines/manufacturing/components/Profile';
import ManufacturingFloorDashboard from './disciplines/manufacturing/components/FloorDashboard';
import ManufacturingFloorFreddieWidget from './disciplines/manufacturing/components/FloorFreddieWidget';

// Logistics imports
import LogisticsNavBar from './disciplines/logistics/components/NavBar';
import LogisticsMyDock from './disciplines/logistics/modules/MyDock';
import LogisticsMyRunbook from './disciplines/logistics/modules/MyRunbook';
import LogisticsDispatchLounge from './disciplines/logistics/modules/DispatchLounge';
import LogisticsLogisticsSchool from './disciplines/logistics/modules/LogisticsSchool';
import LogisticsProfile from './disciplines/logistics/components/Profile';
import LogisticsDockDashboard from './disciplines/logistics/components/DockDashboard';
import LogisticsDockFreddieWidget from './disciplines/logistics/components/DockFreddieWidget';

// Machining imports
import MachiningNavBar from './disciplines/welding/components/NavBar';
import MachiningMyTorch from './disciplines/welding/modules/MyBench';
import MachiningMyWeldBook from './disciplines/welding/modules/MySpecBook';
import MachiningWeldersHub from './disciplines/welding/modules/MachinistCorner';
import MachiningWeldingSchool from './disciplines/welding/modules/MachiningSchool';
import MachiningProfile from './disciplines/welding/components/Profile';
import MachiningBenchDashboard from './disciplines/welding/components/BenchDashboard';
import MachiningBenchFreddieWidget from './disciplines/welding/components/BenchFreddieWidget';
import { FreddieProvider as WeldingFreddieProvider } from './disciplines/welding/components/BenchFreddieContext';
import { RecipeProvider as WeldingRecipeProvider } from './disciplines/welding/components/PartContext';
import { FreddieProvider } from './disciplines/culinary/components/FreddieContext';
import { RecipeProvider } from './disciplines/culinary/components/RecipeContext';
import { RouteProvider } from './disciplines/logistics/components/RouteContext';
import { FreddieProvider as LogisticsFreddieProvider } from './disciplines/logistics/components/DockFreddieContext';
import DisciplineSupabaseProvider, { useSupabase } from './components/DisciplineSupabaseProvider';
import type { WristbandSessionMetadata } from './disciplines/culinary/types/session-types';
import { setSupabaseJwt } from './disciplines/culinary/api/supabaseClient';
import { setSupabaseJwt as setPlumbingSupabaseJwt } from './disciplines/plumbing/api/supabaseClient';
import { getSupabaseClient as setAutomotiveSupabaseJwt } from './disciplines/automotive/api/supabaseClient';
import { getSupabaseClient as setConstructionSupabaseJwt } from './disciplines/construction/api/supabaseClient';
import { setSupabaseJwt as setElectricalSupabaseJwt } from './disciplines/electrical/api/supabaseClient';
import { setSupabaseJwt as setHvacSupabaseJwt } from './disciplines/hvac/api/supabaseClient';
import { setSupabaseJwt as setManufacturingSupabaseJwt } from './disciplines/manufacturing/api/supabaseClient';
import { setSupabaseJwt as setLogisticsSupabaseJwt } from './disciplines/logistics/api/supabaseClient';
import { setSupabaseJwt as setMachiningSupabaseJwt } from './disciplines/welding/api/supabaseClient';
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
  const { authStatus } = useWristbandAuth();
  const { user, isLoading } = useSupabase();

  console.log('HomeRedirect - isLoading:', isLoading, 'authStatus:', authStatus, 'user:', !!user);

  useEffect(() => {
    if (isLoading) return;
    
    // If Wristband confirms unauthenticated, redirect to login
    if (authStatus === AuthStatus.UNAUTHENTICATED) {
      window.location.href = '/.netlify/functions/auth-login';
      return;
    }

    // If authenticated and user is loaded, go to discipline selector
    if (authStatus === AuthStatus.AUTHENTICATED && user) {
      console.log('HomeRedirect - Authenticated, navigating to selector');
      navigate('/select-discipline', { replace: true });
    }
  }, [authStatus, user, isLoading, navigate]);

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
      Kitchen: MachiningMyTorch,
      Cookbook: MachiningMyWeldBook,
      Corner: MachiningWeldersHub,
      School: MachiningWeldingSchool,
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

const DynamicDisciplineRoute = ({ page }: { page: 'dashboard' | 'profile' | 'workspace' | 'notebook' | 'community' | 'school' }) => {
  const { discipline } = useParams<{ discipline: string }>();

  if (!discipline) {
    return <Navigate to="/select-discipline" replace />;
  }

  const components = getDisciplineComponents(discipline);

  switch (page) {
    case 'dashboard':
      return <components.Dashboard />;
    case 'profile':
      return <components.Profile />;
    case 'workspace':
      return <components.Kitchen />;
    case 'notebook':
      return <components.Cookbook />;
    case 'community':
      return <components.Corner />;
    case 'school':
      return <components.School />;
    default:
      return <Navigate to="/select-discipline" replace />;
  }
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authStatus } = useWristbandAuth();
  const { user, isLoading } = useSupabase();
  const { isAdminMode } = useAdminToggle();
  const { currentDiscipline } = useDiscipline();
  const hasRedirected = useRef(false);

  // Post-auth routing useEffect - ALWAYS at top level
  useEffect(() => {
    if (!user || isLoading) return;

    const isRoot = location.pathname === '/';
    const isSelector = location.pathname === '/select-discipline';
    const isAdmin = location.pathname === '/admin';
    const disciplineFromPath = getDisciplineFromPath(location.pathname);
    const selectedDiscipline = localStorage.getItem('selectedDiscipline');

    if (isRoot) {
      navigate('/select-discipline', { replace: true });
      return;
    }

    if (isSelector || isAdmin || disciplineFromPath) {
      return;
    }

    if (!selectedDiscipline) {
      navigate('/select-discipline', { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  // Auto logout functionality
  const { showWarning, countdown, stayLoggedIn, logoutNow } = useAutoLogout();
  
  // Render logic happens AFTER hooks
  console.log('AppRoutes - isLoading:', isLoading, 'user:', !!user, 'path:', location.pathname);
  
  // While Wristband is still determining auth status, show a loading screen.
  if (authStatus !== AuthStatus.AUTHENTICATED && authStatus !== AuthStatus.UNAUTHENTICATED) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  // If Wristband confirms the user is NOT authenticated, redirect to login immediately.
  if (authStatus === AuthStatus.UNAUTHENTICATED) {
    console.log('AppRoutes - User unauthenticated, redirecting to login');
    window.location.href = '/.netlify/functions/auth-login';
    return null;
  }

  // User is authenticated via Wristband but Supabase user is still loading.
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  const isDisciplineSelect = location.pathname === '/select-discipline';
  const isAdminRoute = location.pathname === '/admin';

  // Get discipline components for NavBar
  const disciplineFromPath = getDisciplineFromPath(location.pathname);
  const discipline = disciplineFromPath;
  const components = discipline ? getDisciplineComponents(discipline) : null;

  return (
    <div className="min-h-screen bg-sand">
      {!isDisciplineSelect && !isAdminRoute && components?.NavBar && <components.NavBar />}
      {isAdminRoute && <CulinaryNavBar />}
      <main className={`max-w-5xl mx-auto px-4 pt-4 pb-8`}>
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
          <Route path="/welding/dashboard" element={<MachiningBenchDashboard />} />
          <Route path="/welding/my-torch" element={<MachiningMyTorch />} />
          <Route path="/welding/my-weldbook" element={<MachiningMyWeldBook />} />
          <Route path="/welding/welders-hub" element={<MachiningWeldersHub />} />
          <Route path="/welding/welding-school" element={<MachiningWeldingSchool />} />
          <Route path="/welding/profile" element={<MachiningProfile />} />

          {/* Backward-compatible redirects for legacy machining URLs */}
          <Route path="/machining/dashboard" element={<Navigate to="/welding/dashboard" replace />} />
          <Route path="/welding/my-bench" element={<Navigate to="/welding/my-torch" replace />} />
          <Route path="/machining/my-bench" element={<Navigate to="/welding/my-torch" replace />} />
          <Route path="/welding/my-specbook" element={<Navigate to="/welding/my-weldbook" replace />} />
          <Route path="/machining/my-specbook" element={<Navigate to="/welding/my-weldbook" replace />} />
          <Route path="/welding/machinist-corner" element={<Navigate to="/welding/welders-hub" replace />} />
          <Route path="/machining/machinist-corner" element={<Navigate to="/welding/welders-hub" replace />} />
          <Route path="/welding/machining-school" element={<Navigate to="/welding/welding-school" replace />} />
          <Route path="/machining/machining-school" element={<Navigate to="/welding/welding-school" replace />} />
          <Route path="/machining/profile" element={<Navigate to="/welding/profile" replace />} />

          {/* Dynamic custom discipline routes */}
          <Route path="/:discipline/dashboard" element={<DynamicDisciplineRoute page="dashboard" />} />
          <Route path="/:discipline/profile" element={<DynamicDisciplineRoute page="profile" />} />
          <Route path="/:discipline/my-workspace" element={<DynamicDisciplineRoute page="workspace" />} />
          <Route path="/:discipline/my-notebook" element={<DynamicDisciplineRoute page="notebook" />} />
          <Route path="/:discipline/community" element={<DynamicDisciplineRoute page="community" />} />
          <Route path="/:discipline/school" element={<DynamicDisciplineRoute page="school" />} />
          
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/select-discipline" replace />} />
        </Routes>
      </main>
      {!isDisciplineSelect && !isAdminRoute && components?.FreddieWidget && <components.FreddieWidget />}
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
          setPlumbingSupabaseJwt(supabaseToken);
          setAutomotiveSupabaseJwt(supabaseToken);
          setConstructionSupabaseJwt(supabaseToken);
          setElectricalSupabaseJwt(supabaseToken);
          setHvacSupabaseJwt(supabaseToken);
          setManufacturingSupabaseJwt(supabaseToken);
          setLogisticsSupabaseJwt(supabaseToken);
          setMachiningSupabaseJwt(supabaseToken);
        }}
      >
        <RecipeProvider>
          <RouteProvider>
            <FreddieProvider>
              <LogisticsFreddieProvider>
                <WeldingFreddieProvider>
                  <WeldingRecipeProvider>
                    <DisciplineProvider>
                      <DisciplineSupabaseProvider>
                        <AppRoutes />
                      </DisciplineSupabaseProvider>
                    </DisciplineProvider>
                  </WeldingRecipeProvider>
                </WeldingFreddieProvider>
              </LogisticsFreddieProvider>
            </FreddieProvider>
          </RouteProvider>
        </RecipeProvider>
      </WristbandAuthProvider>
    </AdminToggleProvider>
  );
};

export default App;
