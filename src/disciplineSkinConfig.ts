import { DisciplineKey, BaseDisciplineKey, BASE_DISCIPLINE_CONFIG } from './disciplineConfig';
import { supabase } from './disciplines/culinary/api/supabaseClient';

export interface DisciplineSkin {
  key: DisciplineKey;
  name: string;
  icon: string;
  modules: {
    workspace: string;       // e.g. "My Kitchen"
    notebook: string;        // e.g. "My Cookbook"
    community: string;       // e.g. "Chef's Corner"
    school: string;          // e.g. "Culinary School"
  };
  assistant: {
    name: string;            // e.g. "Chef Freddie"
    greeting: string;        // Opening message in the chat
    systemPrompt: string;    // AI persona system prompt
    quickActions: string[];  // Suggested prompts
  };
  content: {
    metricLabel: string;     // e.g. "Recipes" — used in stat cards
    table: string;           // Supabase table name for content count
    approvalLabel: string;   // e.g. "Recipe Approval"
  };
  people: {
    facultyTitle: string;    // e.g. "Chef"
    defaultProgram: string;  // e.g. "Culinary Arts"
    mockFaculty: { name: string; role: string; courses: string }[];
    mockAlumniTitles: string[];
    emailDomain: string;
  };
}

// Base discipline skins (hardcoded)
export const BASE_DISCIPLINE_SKIN: Record<BaseDisciplineKey, DisciplineSkin> = {
  culinary: {
    key: 'culinary',
    name: 'Culinary',
    icon: '🍳',
    modules: {
      workspace: 'My Kitchen',
      notebook: 'My Cookbook',
      community: "Chef's Corner",
      school: 'Culinary School',
    },
    assistant: {
      name: 'Tojimaster Kito',
      greeting:
        "Hi! I'm Tojimaster Kito, your curriculum assistant. I can help you create assignments, lesson plans, rubrics, and apply curriculum to your modules. Try asking: 'Create a Week 5 assignment for sauce making' or 'Design a rubric for knife skills assessment'",
      systemPrompt:
        'You are Tojimaster Kito, a curriculum assistant for culinary trade schools. Help create educational content, assignments, lesson plans, and rubrics for culinary education. Focus on practical cooking skills, food safety, kitchen management, and professional culinary techniques.',
      quickActions: [
        'Create a knife skills rubric',
        'Write a Week 3 sauce lesson plan',
        'Design a food safety quiz',
      ],
    },
    content: {
      metricLabel: 'Recipes',
      table: 'user_cookbook',
      approvalLabel: 'Recipe Approval',
    },
    people: {
      facultyTitle: 'Chef',
      defaultProgram: 'Culinary Arts',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'culinaryschool.edu',
    },
  },

  plumbing: {
    key: 'plumbing',
    name: 'Plumbing',
    icon: '🔩',
    modules: {
      workspace: 'My Van',
      notebook: 'My Pipebook',
      community: 'Pipe Lounge',
      school: 'Plumbing School',
    },
    assistant: {
      name: 'Pete the Plumber',
      greeting:
        "Hey! I'm Pete the Plumber, your curriculum assistant for plumbing programs. I can help you create assignments, lesson plans, and rubrics. Try asking: 'Create a pipe fitting assessment' or 'Write a water heater installation lesson plan'",
      systemPrompt:
        'You are Pete the Plumber, a curriculum assistant for plumbing trade schools. Help create educational content, assignments, lesson plans, and rubrics for plumbing education. Focus on pipe fitting, water systems, code compliance, safety, and professional plumbing techniques.',
      quickActions: [
        'Create a pipe fitting rubric',
        'Write a drain installation lesson plan',
        'Design a plumbing code quiz',
      ],
    },
    content: {
      metricLabel: 'Projects',
      table: 'user_pipebook',
      approvalLabel: 'Project Approval',
    },
    people: {
      facultyTitle: 'Master Plumber',
      defaultProgram: 'Plumbing Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'plumbingschool.edu',
    },
  },

  automotive: {
    key: 'automotive',
    name: 'Automotive',
    icon: '🔧',
    modules: {
      workspace: 'My Garage',
      notebook: 'My Manual',
      community: 'Gearhead Lounge',
      school: 'Auto School',
    },
    assistant: {
      name: 'Garage Puddy',
      greeting:
        "Hey! I'm Garage Puddy, your curriculum assistant for automotive programs. I can help you create assignments, diagnostics rubrics, and lesson plans. Try asking: 'Create a brake inspection checklist' or 'Write a lesson plan for engine diagnostics'",
      systemPrompt:
        'You are Garage Puddy, a curriculum assistant for automotive trade schools. Help create educational content, assignments, lesson plans, and rubrics for automotive education. Focus on diagnostics, engine repair, electrical systems, safety, and professional automotive techniques.',
      quickActions: [
        'Create a brake inspection rubric',
        'Write an engine diagnostics lesson plan',
        'Design an OBD-II systems quiz',
      ],
    },
    content: {
      metricLabel: 'Repair Orders',
      table: 'user_manual',
      approvalLabel: 'Repair Order Approval',
    },
    people: {
      facultyTitle: 'Master Tech',
      defaultProgram: 'Automotive Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'autotech.edu',
    },
  },

  construction: {
    key: 'construction',
    name: 'Construction',
    icon: '🏗️',
    modules: {
      workspace: 'My Site',
      notebook: 'My Blueprints',
      community: 'Hardhat Hub',
      school: 'Build School',
    },
    assistant: {
      name: 'Foreman Frank',
      greeting:
        "Hey! I'm Foreman Frank, your curriculum assistant for construction programs. I can help you create assignments, safety rubrics, and lesson plans. Try asking: 'Create a framing assessment' or 'Write a site safety lesson plan'",
      systemPrompt:
        'You are Foreman Frank, a curriculum assistant for construction trade schools. Help create educational content, assignments, lesson plans, and rubrics for construction education. Focus on framing, masonry, site safety, blueprint reading, project management, and professional construction techniques.',
      quickActions: [
        'Create a framing inspection rubric',
        'Write a site safety lesson plan',
        'Design a blueprint reading quiz',
      ],
    },
    content: {
      metricLabel: 'Build Plans',
      table: 'user_blueprints',
      approvalLabel: 'Build Plan Approval',
    },
    people: {
      facultyTitle: 'Foreman',
      defaultProgram: 'Construction Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'buildschool.edu',
    },
  },

  electrical: {
    key: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    modules: {
      workspace: 'My Panel',
      notebook: 'My Codebook',
      community: 'Wire Lounge',
      school: 'Elec School',
    },
    assistant: {
      name: 'Sparky the Lineman',
      greeting:
        "Hey! I'm Sparky the Lineman, your curriculum assistant for electrical programs. I can help you create assignments, code rubrics, and lesson plans. Try asking: 'Create a panel wiring assessment' or 'Write a NEC code compliance lesson plan'",
      systemPrompt:
        'You are Sparky the Lineman, a curriculum assistant for electrical trade schools. Help create educational content, assignments, lesson plans, and rubrics for electrical education. Focus on wiring, NEC code compliance, panel installation, safety, and professional electrical techniques.',
      quickActions: [
        'Create a panel wiring rubric',
        'Write a NEC compliance lesson plan',
        'Design a circuit theory quiz',
      ],
    },
    content: {
      metricLabel: 'Wiring Diagrams',
      table: 'user_codebook',
      approvalLabel: 'Diagram Approval',
    },
    people: {
      facultyTitle: 'Master Electrician',
      defaultProgram: 'Electrical Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'elecschool.edu',
    },
  },

  hvac: {
    key: 'hvac',
    name: 'HVAC',
    icon: '❄️',
    modules: {
      workspace: 'My Shop',
      notebook: 'My Spec Sheets',
      community: 'Tech Talk',
      school: 'HVAC School',
    },
    assistant: {
      name: 'Freon Frankie',
      greeting:
        "Hey! I'm Freon Frankie, your curriculum assistant for HVAC programs. I can help you create assignments, diagnostic rubrics, and lesson plans. Try asking: 'Create a refrigerant recovery assessment' or 'Write a heat pump troubleshooting lesson plan'",
      systemPrompt:
        'You are Freon Frankie, a curriculum assistant for HVAC trade schools. Help create educational content, assignments, lesson plans, and rubrics for HVAC education. Focus on refrigeration, heat pumps, air distribution, EPA 608 certification, safety, and professional HVAC techniques.',
      quickActions: [
        'Create a refrigerant recovery rubric',
        'Write a heat pump lesson plan',
        'Design an EPA 608 prep quiz',
      ],
    },
    content: {
      metricLabel: 'Service Reports',
      table: 'user_specsheets',
      approvalLabel: 'Service Report Approval',
    },
    people: {
      facultyTitle: 'HVAC Tech',
      defaultProgram: 'HVAC Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'hvacschool.edu',
    },
  },

  manufacturing: {
    key: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    modules: {
      workspace: 'My Floor',
      notebook: 'My Playbook',
      community: 'Shop Talk',
      school: 'Mfg Academy',
    },
    assistant: {
      name: 'Button Pusher Max',
      greeting:
        "Hey! I'm Button Pusher Max, your curriculum assistant for manufacturing programs. I can help you create assignments, quality rubrics, and lesson plans. Try asking: 'Create a GD&T measurement assessment' or 'Write a lean manufacturing lesson plan'",
      systemPrompt:
        'You are Button Pusher Max, a curriculum assistant for manufacturing trade schools. Help create educational content, assignments, lesson plans, and rubrics for manufacturing education. Focus on precision measurement, quality control, lean manufacturing, safety, and professional manufacturing techniques.',
      quickActions: [
        'Create a quality inspection rubric',
        'Write a lean manufacturing lesson plan',
        'Design a blueprint reading quiz',
      ],
    },
    content: {
      metricLabel: 'Work Orders',
      table: 'user_playbook',
      approvalLabel: 'Work Order Approval',
    },
    people: {
      facultyTitle: 'Lead Engineer',
      defaultProgram: 'Manufacturing Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'mfgacademy.edu',
    },
  },

  logistics: {
    key: 'logistics',
    name: 'Logistics',
    icon: '📦',
    modules: {
      workspace: 'My Dock',
      notebook: 'My Runbook',
      community: 'Dispatch Lounge',
      school: 'Logistics School',
    },
    assistant: {
      name: 'Gear Jamming Daniel',
      greeting:
        "Hey! I'm Gear Jamming Daniel, your curriculum assistant for logistics programs. I can help you create assignments, routing rubrics, and lesson plans. Try asking: 'Create a freight routing assessment' or 'Write a warehouse safety lesson plan'",
      systemPrompt:
        'You are Gear Jamming Daniel, a curriculum assistant for logistics trade schools. Help create educational content, assignments, lesson plans, and rubrics for logistics education. Focus on supply chain, freight routing, warehouse operations, DOT compliance, safety, and professional logistics techniques.',
      quickActions: [
        'Create a freight routing rubric',
        'Write a warehouse operations lesson plan',
        'Design a DOT compliance quiz',
      ],
    },
    content: {
      metricLabel: 'Shipments',
      table: 'user_runbook',
      approvalLabel: 'Shipment Approval',
    },
    people: {
      facultyTitle: 'Logistics Manager',
      defaultProgram: 'Logistics & Supply Chain',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'logisticsschool.edu',
    },
  },

  machining: {
    key: 'machining',
    name: 'Welding',
    icon: '⚙️',
    modules: {
      workspace: 'My Booth',
      notebook: 'My Weldbook',
      community: 'Welders Hub',
      school: 'Welding School',
    },
    assistant: {
      name: 'Ironworker Jake',
      greeting:
        "Hey! I'm Ironworker Jake, your curriculum assistant for welding programs. I can help you create assignments, precision rubrics, and lesson plans. Try asking: 'Create a weld quality assessment' or 'Write a MIG welding lesson plan'",
      systemPrompt:
        'You are Ironworker Jake, a curriculum assistant for welding trade schools. Help create educational content, assignments, lesson plans, and rubrics for welding education. Focus on welding safety, joint preparation, weld symbols, process selection (SMAW, GMAW, GTAW, FCAW), inspection, and professional welding techniques.',
      quickActions: [
        'Create a weld quality rubric',
        'Write a MIG welding lesson plan',
        'Design a welding safety quiz',
      ],
    },
    content: {
      metricLabel: 'Job Tickets',
      table: 'user_specbook',
      approvalLabel: 'Job Ticket Approval',
    },
    people: {
      facultyTitle: 'Welding Instructor',
      defaultProgram: 'Welding Technology',
      mockFaculty: [],
      mockAlumniTitles: [],
      emailDomain: 'weldingschool.edu',
    },
  },
};

// Cache for custom discipline skins
let customSkinsCache: Record<string, DisciplineSkin> | null = null;

/**
 * Load custom discipline skins from Supabase
 */
export async function loadCustomSkins(): Promise<Record<string, DisciplineSkin>> {
  if (customSkinsCache) {
    return customSkinsCache;
  }

  try {
    const { data, error } = await supabase
      .from('custom_disciplines')
      .select('slug, name, skin_config')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading custom skins:', error);
      return {};
    }

    const customSkins: Record<string, DisciplineSkin> = {};
    
    data?.forEach((discipline) => {
      const slug = discipline.slug;
      const skinConfig = discipline.skin_config as Omit<DisciplineSkin, 'key'>;
      
      customSkins[slug] = {
        key: slug,
        ...skinConfig,
      };
    });

    customSkinsCache = customSkins;
    return customSkins;
  } catch (error) {
    console.error('Error loading custom skins:', error);
    return {};
  }
}

/**
 * Get skin for a discipline (supports base and custom disciplines)
 */
export function getSkin(disciplineKey: DisciplineKey | 'total'): DisciplineSkin {
  if (disciplineKey === 'total') {
    return BASE_DISCIPLINE_SKIN.culinary;
  }
  
  // Check base disciplines first
  if (BASE_DISCIPLINE_SKIN[disciplineKey as BaseDisciplineKey]) {
    return BASE_DISCIPLINE_SKIN[disciplineKey as BaseDisciplineKey];
  }
  
  // Check custom disciplines cache
  if (customSkinsCache && customSkinsCache[disciplineKey]) {
    return customSkinsCache[disciplineKey];
  }
  
  return BASE_DISCIPLINE_SKIN.culinary;
}

/**
 * Backwards compatibility export
 */
export const DISCIPLINE_SKIN = BASE_DISCIPLINE_SKIN;
