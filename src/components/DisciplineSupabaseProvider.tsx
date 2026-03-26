import React from 'react';
import { useDiscipline } from '../DisciplineContext';

// Import all SupabaseProviders
import CulinarySupabaseProvider from '../disciplines/culinary/components/SupabaseProvider';
import PlumbingSupabaseProvider from '../disciplines/plumbing/components/SupabaseProvider';
import AutomotiveSupabaseProvider from '../disciplines/automotive/components/SupabaseProvider';
import ConstructionSupabaseProvider from '../disciplines/construction/components/SupabaseProvider';
import ElectricalSupabaseProvider from '../disciplines/electrical/components/SupabaseProvider';
import HvacSupabaseProvider from '../disciplines/hvac/components/SupabaseProvider';
import ManufacturingSupabaseProvider from '../disciplines/manufacturing/components/SupabaseProvider';
import LogisticsSupabaseProvider from '../disciplines/logistics/components/SupabaseProvider';
import MachiningSupabaseProvider from '../disciplines/machining/components/SupabaseProvider';

const DisciplineSupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDiscipline } = useDiscipline();

  const getProvider = () => {
    switch (currentDiscipline) {
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
