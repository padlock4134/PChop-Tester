// Discipline configuration mapping
export const DISCIPLINE_CONFIG = {
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
    name: 'Machining',
    routes: {
      kitchen: '/machining/my-bench',
      cookbook: '/machining/my-specbook',
      corner: '/machining/machinist-corner',
      school: '/machining/machining-school',
      dashboard: '/machining/dashboard',
      profile: '/machining/profile'
    }
  }
} as const;

export type DisciplineKey = keyof typeof DISCIPLINE_CONFIG;

export const getDisciplineFromPath = (pathname: string): DisciplineKey | null => {
  const pathParts = pathname.split('/').filter(Boolean);
  const disciplineFromPath = pathParts[0] as DisciplineKey;
  
  if (DISCIPLINE_CONFIG[disciplineFromPath]) {
    return disciplineFromPath;
  }
  
  return null;
};
