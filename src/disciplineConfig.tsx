import { supabase } from './disciplines/culinary/api/supabaseClient';

// Base discipline configuration mapping (hardcoded disciplines)
export const BASE_DISCIPLINE_CONFIG = {
  culinary: {
    key: 'culinary',
    name: 'Culinary',
    routes: {
      kitchen: '/culinary/my-kitchen',
      cookbook: '/culinary/my-cookbook',
      corner: '/culinary/chefs-corner',
      school: '/culinary/culinary-school',
      dashboard: '/culinary/dashboard',
      profile: '/culinary/profile'
    }
  },
  plumbing: {
    key: 'plumbing',
    name: 'Plumbing',
    routes: {
      kitchen: '/plumbing/my-van',
      cookbook: '/plumbing/my-pipebook',
      corner: '/plumbing/pipe-lounge',
      school: '/plumbing/plumbing-school',
      dashboard: '/plumbing/dashboard',
      profile: '/plumbing/profile'
    }
  },
  automotive: {
    key: 'automotive',
    name: 'Automotive',
    routes: {
      kitchen: '/automotive/my-garage',
      cookbook: '/automotive/my-manual',
      corner: '/automotive/gearhead-lounge',
      school: '/automotive/auto-school',
      dashboard: '/automotive/dashboard',
      profile: '/automotive/profile'
    }
  },
  construction: {
    key: 'construction',
    name: 'Construction',
    routes: {
      kitchen: '/construction/my-site',
      cookbook: '/construction/my-blueprints',
      corner: '/construction/hardhat-hub',
      school: '/construction/build-school',
      dashboard: '/construction/dashboard',
      profile: '/construction/profile'
    }
  },
  electrical: {
    key: 'electrical',
    name: 'Electrical',
    routes: {
      kitchen: '/electrical/my-panel',
      cookbook: '/electrical/my-codebook',
      corner: '/electrical/wire-lounge',
      school: '/electrical/elec-school',
      dashboard: '/electrical/dashboard',
      profile: '/electrical/profile'
    }
  },
  hvac: {
    key: 'hvac',
    name: 'HVAC',
    routes: {
      kitchen: '/hvac/my-shop',
      cookbook: '/hvac/my-specsheets',
      corner: '/hvac/tech-talk',
      school: '/hvac/hvac-school',
      dashboard: '/hvac/dashboard',
      profile: '/hvac/profile'
    }
  },
  manufacturing: {
    key: 'manufacturing',
    name: 'Manufacturing',
    routes: {
      kitchen: '/manufacturing/my-floor',
      cookbook: '/manufacturing/my-playbook',
      corner: '/manufacturing/shop-talk',
      school: '/manufacturing/mfg-academy',
      dashboard: '/manufacturing/dashboard',
      profile: '/manufacturing/profile'
    }
  },
  logistics: {
    key: 'logistics',
    name: 'Logistics',
    routes: {
      kitchen: '/logistics/my-dock',
      cookbook: '/logistics/my-runbook',
      corner: '/logistics/dispatch-lounge',
      school: '/logistics/logistics-school',
      dashboard: '/logistics/dashboard',
      profile: '/logistics/profile'
    }
  },
  machining: {
    key: 'machining',
    name: 'Welding',
    routes: {
      kitchen: '/welding/my-torch',
      cookbook: '/welding/my-weldbook',
      corner: '/welding/welders-hub',
      school: '/welding/welding-school',
      dashboard: '/welding/dashboard',
      profile: '/welding/profile'
    }
  }
} as const;

export type BaseDisciplineKey = keyof typeof BASE_DISCIPLINE_CONFIG;
export type DisciplineKey = BaseDisciplineKey | string; // Allow custom discipline slugs

// Custom discipline interface
interface CustomDiscipline {
  key: string;
  name: string;
  routes: {
    kitchen: string;
    cookbook: string;
    corner: string;
    school: string;
    dashboard: string;
    profile: string;
  };
}

// Cache for custom disciplines
let customDisciplinesCache: Record<string, CustomDiscipline> | null = null;

/**
 * Load custom disciplines from Supabase
 */
export async function loadCustomDisciplines(): Promise<Record<string, CustomDiscipline>> {
  if (customDisciplinesCache) {
    return customDisciplinesCache;
  }

  try {
    const { data, error } = await supabase
      .from('custom_disciplines')
      .select('slug, name')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading custom disciplines:', error);
      return {};
    }

    const customDisciplines: Record<string, CustomDiscipline> = {};
    
    data?.forEach((discipline) => {
      const slug = discipline.slug;
      customDisciplines[slug] = {
        key: slug,
        name: discipline.name,
        routes: {
          kitchen: `/${slug}/my-workspace`,
          cookbook: `/${slug}/my-notebook`,
          corner: `/${slug}/community`,
          school: `/${slug}/school`,
          dashboard: `/${slug}/dashboard`,
          profile: `/${slug}/profile`,
        },
      };
    });

    customDisciplinesCache = customDisciplines;
    return customDisciplines;
  } catch (error) {
    console.error('Error loading custom disciplines:', error);
    return {};
  }
}

/**
 * Get combined discipline config (base + custom)
 */
export async function getDisciplineConfig(): Promise<Record<string, CustomDiscipline | typeof BASE_DISCIPLINE_CONFIG[BaseDisciplineKey]>> {
  const customDisciplines = await loadCustomDisciplines();
  return { ...BASE_DISCIPLINE_CONFIG, ...customDisciplines };
}

/**
 * Synchronous access to discipline config (uses cache)
 */
export const DISCIPLINE_CONFIG = BASE_DISCIPLINE_CONFIG;

const DISCIPLINE_ROUTE_SEGMENTS = new Set([
  'dashboard',
  'profile',
  'my-kitchen',
  'my-cookbook',
  'chefs-corner',
  'culinary-school',
  'my-van',
  'my-pipebook',
  'pipe-lounge',
  'plumbing-school',
  'my-garage',
  'my-manual',
  'gearhead-lounge',
  'auto-school',
  'my-site',
  'my-blueprints',
  'hardhat-hub',
  'build-school',
  'my-panel',
  'my-codebook',
  'wire-lounge',
  'elec-school',
  'my-shop',
  'my-specsheets',
  'tech-talk',
  'hvac-school',
  'my-floor',
  'my-playbook',
  'shop-talk',
  'mfg-academy',
  'my-dock',
  'my-runbook',
  'dispatch-lounge',
  'logistics-school',
  'my-torch',
  'my-weldbook',
  'welders-hub',
  'welding-school',
  // Generic/custom discipline pages
  'my-workspace',
  'my-notebook',
  'community',
  'school',
]);

export const getDisciplineFromPath = (pathname: string): DisciplineKey | null => {
  const pathParts = pathname.split('/').filter(Boolean);
  const disciplineFromPath = pathParts[0];
  const routeSegment = pathParts[1];

  if (!disciplineFromPath) return null;

  // Alias welding routes to machining discipline components/data
  if (disciplineFromPath === 'welding') {
    return 'machining';
  }

  // Check base disciplines
  if (BASE_DISCIPLINE_CONFIG[disciplineFromPath as BaseDisciplineKey]) {
    return disciplineFromPath as BaseDisciplineKey;
  }

  // Check custom disciplines cache
  if (customDisciplinesCache && customDisciplinesCache[disciplineFromPath]) {
    return disciplineFromPath;
  }

  // Fallback: treat unknown slugs that match discipline page patterns as custom disciplines.
  if (routeSegment && DISCIPLINE_ROUTE_SEGMENTS.has(routeSegment)) {
    return disciplineFromPath;
  }

  return null;
};

/**
 * Check if a discipline key is a custom discipline
 */
export function isCustomDiscipline(key: string): boolean {
  return !BASE_DISCIPLINE_CONFIG[key as BaseDisciplineKey] && 
         customDisciplinesCache?.[key] !== undefined;
}
