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
      name: 'Chef Freddie',
      greeting:
        "Hi! I'm Chef Freddie, your curriculum assistant. I can help you create assignments, lesson plans, rubrics, and apply curriculum to your modules. Try asking: 'Create a Week 5 assignment for sauce making' or 'Design a rubric for knife skills assessment'",
      systemPrompt:
        'You are Chef Freddie, a curriculum assistant for culinary trade schools. Help create educational content, assignments, lesson plans, and rubrics for culinary education. Focus on practical cooking skills, food safety, kitchen management, and professional culinary techniques.',
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
      mockFaculty: [
        { name: 'Chef Julia Davis', role: 'Head of Culinary Arts', courses: 'Advanced Techniques, Sauce Mastery' },
        { name: 'Chef Marco Rodriguez', role: 'Pastry Arts Instructor', courses: 'Baking Fundamentals, Cake Decoration' },
      ],
      mockAlumniTitles: ['Executive Chef', 'Restaurant Owner', 'Food Network Personality', 'Corporate Food Service Director'],
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
        "Hey! I'm Pete, your curriculum assistant for plumbing programs. I can help you create assignments, lesson plans, and rubrics. Try asking: 'Create a pipe fitting assessment' or 'Write a water heater installation lesson plan'",
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
      mockFaculty: [
        { name: 'Master Plumber Rick Torres', role: 'Head of Plumbing Technology', courses: 'Pipe Systems, Code Compliance' },
        { name: 'Master Plumber Linda Hayes', role: 'Drainage Systems Instructor', courses: 'Drain & Waste, Water Heaters' },
      ],
      mockAlumniTitles: ['Licensed Master Plumber', 'Plumbing Contractor', 'Facilities Manager', 'Plumbing Inspector'],
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
      name: 'Gus the Mechanic',
      greeting:
        "Hey! I'm Gus, your curriculum assistant for automotive programs. I can help you create assignments, diagnostics rubrics, and lesson plans. Try asking: 'Create a brake inspection checklist' or 'Write a lesson plan for engine diagnostics'",
      systemPrompt:
        'You are Gus the Mechanic, a curriculum assistant for automotive trade schools. Help create educational content, assignments, lesson plans, and rubrics for automotive education. Focus on diagnostics, engine repair, electrical systems, safety, and professional automotive techniques.',
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
      mockFaculty: [
        { name: 'Master Tech Dave Kowalski', role: 'Head of Automotive Technology', courses: 'Engine Systems, Diagnostics' },
        { name: 'Master Tech Sandra Mills', role: 'Electrical Systems Instructor', courses: 'Auto Electrical, Hybrid Systems' },
      ],
      mockAlumniTitles: ['ASE Master Technician', 'Shop Owner', 'Dealer Service Manager', 'Fleet Maintenance Director'],
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
      mockFaculty: [
        { name: 'Foreman Bill Nakamura', role: 'Head of Construction Technology', courses: 'Framing, Blueprint Reading' },
        { name: 'Foreman Rosa Vasquez', role: 'Masonry Instructor', courses: 'Concrete, Brickwork' },
      ],
      mockAlumniTitles: ['General Contractor', 'Site Superintendent', 'Project Manager', 'Construction Inspector'],
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
      name: 'Sparky',
      greeting:
        "Hey! I'm Sparky, your curriculum assistant for electrical programs. I can help you create assignments, code rubrics, and lesson plans. Try asking: 'Create a panel wiring assessment' or 'Write a NEC code compliance lesson plan'",
      systemPrompt:
        'You are Sparky, a curriculum assistant for electrical trade schools. Help create educational content, assignments, lesson plans, and rubrics for electrical education. Focus on wiring, NEC code compliance, panel installation, safety, and professional electrical techniques.',
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
      mockFaculty: [
        { name: 'Master Electrician Tom Walsh', role: 'Head of Electrical Technology', courses: 'NEC Code, Panel Systems' },
        { name: 'Master Electrician Keisha Brown', role: 'Industrial Systems Instructor', courses: 'Motor Controls, PLC Basics' },
      ],
      mockAlumniTitles: ['Licensed Master Electrician', 'Electrical Contractor', 'Building Inspector', 'Facilities Electrician'],
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
      name: 'Cool Cal',
      greeting:
        "Hey! I'm Cool Cal, your curriculum assistant for HVAC programs. I can help you create assignments, diagnostic rubrics, and lesson plans. Try asking: 'Create a refrigerant recovery assessment' or 'Write a heat pump troubleshooting lesson plan'",
      systemPrompt:
        'You are Cool Cal, a curriculum assistant for HVAC trade schools. Help create educational content, assignments, lesson plans, and rubrics for HVAC education. Focus on refrigeration, heat pumps, air distribution, EPA 608 certification, safety, and professional HVAC techniques.',
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
      mockFaculty: [
        { name: 'HVAC Tech Gary Odom', role: 'Head of HVAC Technology', courses: 'Refrigeration, Heat Pumps' },
        { name: 'HVAC Tech Priya Patel', role: 'Air Distribution Instructor', courses: 'Ductwork, Air Balancing' },
      ],
      mockAlumniTitles: ['HVAC Service Manager', 'Refrigeration Technician', 'Building Systems Engineer', 'EPA Certified Contractor'],
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
      name: 'Mac the Manufacturer',
      greeting:
        "Hey! I'm Mac, your curriculum assistant for manufacturing programs. I can help you create assignments, quality rubrics, and lesson plans. Try asking: 'Create a GD&T measurement assessment' or 'Write a lean manufacturing lesson plan'",
      systemPrompt:
        'You are Mac the Manufacturer, a curriculum assistant for manufacturing trade schools. Help create educational content, assignments, lesson plans, and rubrics for manufacturing education. Focus on precision measurement, quality control, lean manufacturing, safety, and professional manufacturing techniques.',
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
      mockFaculty: [
        { name: 'Lead Engineer Carlos Rivera', role: 'Head of Manufacturing Technology', courses: 'Quality Control, CNC Basics' },
        { name: 'Lead Engineer Yuki Tanaka', role: 'Lean Systems Instructor', courses: 'Lean Manufacturing, Six Sigma' },
      ],
      mockAlumniTitles: ['Production Supervisor', 'Quality Engineer', 'Plant Manager', 'Manufacturing Technician'],
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
      name: 'Lou the Dispatcher',
      greeting:
        "Hey! I'm Lou, your curriculum assistant for logistics programs. I can help you create assignments, routing rubrics, and lesson plans. Try asking: 'Create a freight routing assessment' or 'Write a warehouse safety lesson plan'",
      systemPrompt:
        'You are Lou the Dispatcher, a curriculum assistant for logistics trade schools. Help create educational content, assignments, lesson plans, and rubrics for logistics education. Focus on supply chain, freight routing, warehouse operations, DOT compliance, safety, and professional logistics techniques.',
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
      mockFaculty: [
        { name: 'Logistics Manager Dana Scott', role: 'Head of Logistics Technology', courses: 'Supply Chain, DOT Compliance' },
        { name: 'Logistics Manager Omar Abdullah', role: 'Warehouse Operations Instructor', courses: 'WMS Systems, Forklift Ops' },
      ],
      mockAlumniTitles: ['Distribution Center Manager', 'Fleet Coordinator', 'Supply Chain Analyst', 'Warehouse Supervisor'],
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
      name: 'Weld Coach Max',
      greeting:
        "Hey! I'm Max, your curriculum assistant for welding programs. I can help you create assignments, precision rubrics, and lesson plans. Try asking: 'Create a weld quality assessment' or 'Write a MIG welding lesson plan'",
      systemPrompt:
        'You are Weld Coach Max, a curriculum assistant for welding trade schools. Help create educational content, assignments, lesson plans, and rubrics for welding education. Focus on welding safety, joint preparation, weld symbols, process selection (SMAW, GMAW, GTAW, FCAW), inspection, and professional welding techniques.',
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
      mockFaculty: [
        { name: 'Instructor Phil Grant', role: 'Head of Welding Technology', courses: 'SMAW Foundations, Blueprint Reading' },
        { name: 'Instructor Ana Flores', role: 'Welding Processes Instructor', courses: 'GMAW, GTAW, FCAW' },
      ],
      mockAlumniTitles: ['Certified Welder', 'Welding Fabricator', 'Welding Inspector', 'Welding Engineer'],
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
