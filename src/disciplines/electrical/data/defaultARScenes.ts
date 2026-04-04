// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const panelCircuitIsolation = {
  lesson: "Panel Circuit Identification and Safe Isolation",
  setup: {
    workspace: "Clear workspace in front of a labeled breaker panel with safe access and good lighting",
    requiredTools: ["breaker panel", "non-contact voltage tester", "circuit directory", "lockout tag", "insulated screwdriver"],
    requiredIngredients: []
  },
  steps: [
    {
      id: 1,
      instruction: "Verify the work area is dry and clear. Confirm panel labels are visible and put on proper PPE before opening the panel.",
      duration: "30s",
      tools: ["Breaker panel", "PPE"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Area clear + PPE on",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Dry and uncluttered workspace",
        "Panel labels readable",
        "PPE before panel interaction"
      ]
    },
    {
      id: 2,
      instruction: "Use the circuit directory to locate the target branch circuit. Confirm breaker position and match the label before touching controls.",
      duration: "45s",
      tools: ["Circuit directory", "Breaker panel"],
      ingredients: [],
      overlays: [
        {
          type: "line",
          label: "Target breaker",
          color: "#F59E0B",
          angle: 90
        },
        {
          type: "text",
          label: "Label match",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Identify correct breaker",
        "Verify label and location",
        "Do not guess circuit assignment"
      ]
    },
    {
      id: 3,
      instruction: "Test nearby conductors and panel face with a non-contact tester before switching. Confirm tester response on known live source first.",
      duration: "60s",
      tools: ["Non-contact voltage tester", "Breaker panel"],
      ingredients: [],
      overlays: [
        {
          type: "arrow",
          label: "Scan test path",
          color: "#3B82F6",
          direction: "forward"
        },
        {
          type: "line",
          label: "Probe route",
          color: "#3B82F6",
          angle: 0
        }
      ],
      keyPoints: [
        "Prove tester on known live point",
        "Scan systematically",
        "Keep hands clear of exposed parts",
        "Verify reading confidence"
      ]
    },
    {
      id: 4,
      instruction: "Switch the identified breaker to OFF with a controlled motion. Confirm full travel to the OFF position.",
      duration: "90s",
      tools: ["Breaker panel"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Breaker OFF",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Controlled switch action",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Deliberate switch action",
        "Confirm full OFF position",
        "No partial/tripped midpoint"
      ]
    },
    {
      id: 5,
      instruction: "Apply lockout/tagout on the isolated breaker. Confirm lock and tag are visible and secure.",
      duration: "90s",
      tools: ["Lockout tag", "Breaker panel"],
      ingredients: [],
      overlays: [
        {
          type: "line",
          label: "LOTO applied",
          color: "#F59E0B",
          angle: 90
        },
        {
          type: "text",
          label: "Lock + tag visible",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Lock physically installed",
        "Tag readable",
        "No unauthorized reset",
        "Isolation controlled"
      ]
    },
    {
      id: 6,
      instruction: "Re-test at the work point to confirm de-energized condition. Verify zero indication before proceeding.",
      duration: "45s",
      tools: ["Non-contact voltage tester"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Verify de-energized",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "arrow",
          label: "Confirm zero reading",
          color: "#EF4444",
          direction: "across"
        }
      ],
      keyPoints: [
        "Test at actual work point",
        "No voltage indication",
        "Re-check if uncertain",
        "Safety before task"
      ]
    },
    {
      id: 7,
      instruction: "Document breaker ID, time, and lockout status. Perform a final visual check of panel condition and labeling.",
      duration: "60s",
      tools: ["Circuit directory", "Lockout tag"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Record + verify",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Final panel check",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Log breaker and timestamp",
        "Confirm lockout remains in place",
        "Panel remains orderly",
        "Labels still legible"
      ]
    },
    {
      id: 8,
      instruction: "Complete isolation confirmation and proceed to planned electrical work only after all checks pass.",
      duration: "30s",
      tools: ["Breaker panel", "Non-contact voltage tester"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Isolation confirmed",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Safe to proceed",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "All safety checks complete",
        "Circuit status confirmed",
        "Documentation complete",
        "Ready for next task"
      ]
    }
  ],
  tips: [
    "Always verify test equipment before and after checking a circuit",
    "Treat every conductor as live until proven otherwise",
    "Keep one clear sequence: identify, isolate, lock, verify",
    "Slow and deliberate actions reduce mistakes",
    "Consistency and documentation are part of safety"
  ]
};

export const defaultARScenes = {
  "Panel Circuit Identification and Safe Isolation": panelCircuitIsolation,
  "panel isolation": panelCircuitIsolation,
  "breaker lockout": panelCircuitIsolation
};
