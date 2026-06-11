import React, { createContext, useContext, useState } from 'react';
import type { RouteCard } from './RouteMatcherModal';

type RouteContextType = {
  selectedRoute: RouteCard | null;
  setSelectedRoute: (route: RouteCard | null) => void;
  routes: RouteCard[];
  setRoutes: (routes: RouteCard[]) => void;
};

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteCard | null>(null);
  const [routes, setRoutes] = useState<RouteCard[]>([]);

  return (
    <RouteContext.Provider value={{ 
      selectedRoute, 
      setSelectedRoute: (route) => {
        setSelectedRoute((prev: any) => route ? ({
          ...route,
          nutrition: route.nutrition
        }) : null);
      }, 
      routes, 
      setRoutes 
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRouteContext must be used within a RouteProvider');
  return ctx;
};

