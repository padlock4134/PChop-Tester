// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const manifoldGaugeHookup = {
  lesson: "Manifold Gauge Hookup & Pressure Reading",
  setup: {
    workspace: "Outdoor condensing unit with service valves accessible, level ground",
    requiredTools: ["Manifold gauge set", "Refrigerant hoses (3-pack)", "Safety glasses", "Work gloves"],
    requiredIngredients: []
  },
  steps: [
    {
      id: 1,
      instruction: "Inspect your manifold gauge set. Verify both gauges read zero with valves closed. Check hoses for cracks or worn O-rings. Replace any damaged components before proceeding.",
      duration: "30s",
      tools: ["Manifold gauge set", "Hoses"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Both gauges at zero",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Low-side gauge (blue) reads 0 psi",
        "High-side gauge (red) reads 0 psi",
        "All valves fully closed (clockwise)",
        "Hoses in good condition with no cracks"
      ]
    },
    {
      id: 2,
      instruction: "Identify the service valves on the condensing unit. The suction line (larger pipe) connects to the low-side (blue). The liquid line (smaller pipe) connects to the high-side (red).",
      duration: "45s",
      tools: ["Manifold gauge set"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Suction = Large pipe = Blue",
          color: "#3B82F6",
          position: "top"
        },
        {
          type: "text",
          label: "Liquid = Small pipe = Red",
          color: "#EF4444",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Suction line is always the larger diameter",
        "Liquid line is always smaller diameter",
        "Blue hose → suction (low side)",
        "Red hose → liquid (high side)"
      ]
    },
    {
      id: 3,
      instruction: "Connect the blue hose to the suction service valve port. Hand-tighten firmly—do not use a wrench. A slight resistance means the depressor pin is engaged.",
      duration: "60s",
      tools: ["Blue hose", "Manifold gauge set"],
      ingredients: [],
      overlays: [
        {
          type: "arrow",
          label: "Blue → Suction valve",
          color: "#3B82F6",
          direction: "forward"
        }
      ],
      keyPoints: [
        "Hand-tight only—no wrench",
        "Feel the pin depress as you thread on",
        "Check for hissing (leak = rethread)",
        "Valve on manifold stays CLOSED"
      ]
    },
    {
      id: 4,
      instruction: "Connect the red hose to the liquid line service valve port. Same technique—hand-tight. The system is now connected but gauges are still isolated (valves closed).",
      duration: "60s",
      tools: ["Red hose", "Manifold gauge set"],
      ingredients: [],
      overlays: [
        {
          type: "arrow",
          label: "Red → Liquid valve",
          color: "#EF4444",
          direction: "forward"
        },
        {
          type: "text",
          label: "Valves still CLOSED",
          color: "#10B981",
          position: "center"
        }
      ],
      keyPoints: [
        "Hand-tight only",
        "Both manifold valves remain closed",
        "No refrigerant flowing yet",
        "Double-check connections are secure"
      ]
    },
    {
      id: 5,
      instruction: "Now open ONLY the service valves on the unit (if they are backseat-style, turn counterclockwise one quarter turn). Watch both gauges—they should move to show system pressures.",
      duration: "45s",
      tools: ["Service wrench", "Manifold gauge set"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Open service valves on unit",
          color: "#F59E0B",
          position: "center"
        },
        {
          type: "text",
          label: "Watch gauges respond",
          color: "#F59E0B",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Open unit service valves (not manifold valves)",
        "Gauges should deflect to show pressure",
        "Low side typically 60-85 psi (R-410A at rest)",
        "High side same as low if system is off"
      ]
    },
    {
      id: 6,
      instruction: "Record the static pressure reading. With the system off, both sides should equalize. Compare to the temperature-pressure chart for the system's refrigerant type.",
      duration: "45s",
      tools: ["Manifold gauge set", "T-P chart"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Record static pressure",
          color: "#10B981",
          position: "center"
        }
      ],
      keyPoints: [
        "Both gauges should read equal (system off)",
        "Compare to ambient temperature on T-P chart",
        "R-410A at 75°F ≈ 217 psi static",
        "Significantly low = possible leak"
      ]
    },
    {
      id: 7,
      instruction: "Start the system. Watch the gauges separate—low side drops, high side rises. Normal operating: low side 118-130 psi, high side 350-420 psi for R-410A on a typical day.",
      duration: "90s",
      tools: ["Manifold gauge set", "Thermostat"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Low side: 118-130 psi",
          color: "#3B82F6",
          position: "top"
        },
        {
          type: "text",
          label: "High side: 350-420 psi",
          color: "#EF4444",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Low side drops as compressor pulls suction",
        "High side rises as refrigerant is compressed",
        "Allow 10-15 min to stabilize",
        "Record readings once stable"
      ]
    },
    {
      id: 8,
      instruction: "To disconnect: shut system off, close service valves on the unit, then carefully disconnect hoses. A small puff of refrigerant is normal. You've completed a proper gauge hookup.",
      duration: "60s",
      tools: ["Service wrench", "Manifold gauge set"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Close service valves FIRST",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "text",
          label: "Then disconnect hoses",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Always close service valves before disconnecting",
        "Small puff on disconnect is normal",
        "Never vent refrigerant intentionally (EPA violation)",
        "Cap service ports when done"
      ]
    }
  ],
  tips: [
    "Always wear safety glasses—pressurized refrigerant can cause frostbite",
    "If gauges don't move after connecting, check that service valves are open",
    "Keep a temperature-pressure chart handy until values become second nature",
    "Practice identifying suction vs liquid lines by pipe size and temperature",
    "A good technician reads gauges like a pilot reads instruments—constantly"
  ]
};

export const defaultARScenes = {
  "Manifold Gauge Hookup & Pressure Reading": manifoldGaugeHookup,
  "manifold gauges": manifoldGaugeHookup,
  "gauge hookup": manifoldGaugeHookup
};
