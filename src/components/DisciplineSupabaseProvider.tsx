import React from 'react';
import { useDiscipline } from '../DisciplineContext';
import { useLocation } from 'react-router-dom';
import { getDisciplineFromPath } from '../disciplineConfig';

// Import all SupabaseProviders
import CulinarySupabaseProvider, { useSupabase as useCulinarySupabase } from '../disciplines/culinary/components/SupabaseProvider';
import PlumbingSupabaseProvider, { useSupabase as usePlumbingSupabase } from '../disciplines/plumbing/components/SupabaseProvider';
import AutomotiveSupabaseProvider, { useSupabase as useAutomotiveSupabase } from '../disciplines/automotive/components/SupabaseProvider';
import ConstructionSupabaseProvider, { useSupabase as useConstructionSupabase } from '../disciplines/construction/components/SupabaseProvider';
import ElectricalSupabaseProvider, { useSupabase as useElectricalSupabase } from '../disciplines/electrical/components/SupabaseProvider';
import HvacSupabaseProvider, { useSupabase as useHvacSupabase } from '../disciplines/hvac/components/SupabaseProvider';
import ManufacturingSupabaseProvider, { useSupabase as useManufacturingSupabase } from '../disciplines/manufacturing/components/SupabaseProvider';
import LogisticsSupabaseProvider, { useSupabase as useLogisticsSupabase } from '../disciplines/logistics/components/SupabaseProvider';
import MachiningSupabaseProvider, { useSupabase as useMachiningSupabase } from '../disciplines/welding/components/SupabaseProvider';

// Export a discipline-aware useSupabase hook
export const useSupabase = () => {
  const { currentDiscipline } = useDiscipline();
  const location = useLocation();
  const disciplineFromPath = getDisciplineFromPath(location.pathname);
  const activeDiscipline = disciplineFromPath || currentDiscipline;

  // If we're on the discipline selector page, use culinary hook
  if (location.pathname === '/select-discipline') {
    return useCulinarySupabase();
  }

  // Otherwise use discipline-specific hook
  switch (activeDiscipline) {
    case 'culinary':
      return useCulinarySupabase();
    case 'plumbing':
      return usePlumbingSupabase();
    case 'automotive':
      return useAutomotiveSupabase();
    case 'construction':
      return useConstructionSupabase();
    case 'electrical':
      return useElectricalSupabase();
    case 'hvac':
      return useHvacSupabase();
    case 'manufacturing':
      return useManufacturingSupabase();
    case 'logistics':
      return useLogisticsSupabase();
    case 'machining':
      return useMachiningSupabase();
    default:
      return useCulinarySupabase();
  }
};

const DisciplineSupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDiscipline } = useDiscipline();
  const location = useLocation();
  const disciplineFromPath = getDisciplineFromPath(location.pathname);
  const activeDiscipline = disciplineFromPath || currentDiscipline;

  // If we're on the discipline selector page, use culinary as default
  if (location.pathname === '/select-discipline') {
    return <CulinarySupabaseProvider>{children}</CulinarySupabaseProvider>;
  }

  const getProvider = () => {
    switch (activeDiscipline) {
      case 'culinary':
        return CulinarySupabaseProvider;
      case 'plumbing':
        return PlumbingSupabaseProvider;
      case 'automotive':
        return AutomotiveSupabaseProvider;
      case 'construction':
        return ConstructionSupabaseProvider;
      case 'electrical':
        return ElectricalSupabaseProvider;
      case 'hvac':
        return HvacSupabaseProvider;
      case 'manufacturing':
        return ManufacturingSupabaseProvider;
      case 'logistics':
        return LogisticsSupabaseProvider;
      case 'machining':
        return MachiningSupabaseProvider;
      default:
        return CulinarySupabaseProvider;
    }
  };

  const Provider = getProvider();
  return <Provider>{children}</Provider>;
};

export default DisciplineSupabaseProvider;
