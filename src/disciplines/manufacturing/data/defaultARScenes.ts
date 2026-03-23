// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const microElectronicsPackaging = {
  lesson: "Micro-Electronics Conveyor Belt Packaging",
  setup: {
    workspace: "ESD-safe workstation with anti-static mat, proper grounding, and conveyor belt access",
    requiredTools: ["precision tweezers", "ESD wrist strap", "magnifying visor", "anti-static mat", "conveyor belt controller"],
    requiredIngredients: ["SMD components", "PCB boards", "solder paste syringes", "component trays"]
  },
  steps: [
    {
      id: 1,
      instruction: "Set up your ESD-safe workstation. Attach your wrist strap to the grounding point and lay the anti-static mat flat. Verify the conveyor belt is powered on and running at low speed.",
      duration: "30s",
      tools: ["ESD wrist strap", "Anti-static mat", "Conveyor belt controller"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "ESD station ready",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Wrist strap must contact bare skin",
        "Anti-static mat properly grounded",
        "Belt speed set to LOW for training"
      ]
    },
    {
      id: 2,
      instruction: "Pick up the precision tweezers with your dominant hand. Grip them lightly—like holding a pencil. Position your hand over the component tray at a 20-degree approach angle.",
      duration: "45s",
      tools: ["Precision tweezers", "Component tray"],
      ingredients: ["SMD components"],
      overlays: [
        {
          type: "line",
          label: "20° approach",
          color: "#F59E0B",
          angle: 20
        },
        {
          type: "text",
          label: "Light pencil grip",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "20-degree approach angle is optimal",
        "Consistent grip pressure throughout",
        "Light touch—don't crush the component"
      ]
    },
    {
      id: 3,
      instruction: "Gently pick up an SMD component from the tray. Slide it smoothly toward the PCB landing zone on the conveyor belt. Keep a steady hand—precision beats speed.",
      duration: "60s",
      tools: ["Precision tweezers", "Conveyor belt"],
      ingredients: ["SMD components", "PCB boards"],
      overlays: [
        {
          type: "arrow",
          label: "Tray to belt motion",
          color: "#3B82F6",
          direction: "forward"
        },
        {
          type: "line",
          label: "Placement path",
          color: "#3B82F6",
          angle: 0
        }
      ],
      keyPoints: [
        "Smooth, controlled motion",
        "Let the tweezers guide the part",
        "Maintain 20° angle during transfer",
        "Full contact—seat the component flat"
      ]
    },
    {
      id: 4,
      instruction: "Place 10 components in succession. Count each placement aloud. Listen for the soft click as each part seats on the solder pads—that means proper contact.",
      duration: "90s",
      tools: ["Precision tweezers", "Conveyor belt"],
      ingredients: ["SMD components", "PCB boards"],
      overlays: [
        {
          type: "text",
          label: "10 placements",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Listen for the click",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Count each placement",
        "Consistent seating pressure",
        "Soft click = proper pad contact",
        "Smooth, rhythmic workflow"
      ]
    },
    {
      id: 5,
      instruction: "Switch to the opposite side of the PCB. Rotate the board 180° and place 10 more components on the mirrored pads. Your hand position will feel different—that's normal.",
      duration: "90s",
      tools: ["Precision tweezers", "Conveyor belt"],
      ingredients: ["SMD components", "PCB boards"],
      overlays: [
        {
          type: "line",
          label: "20° mirrored side",
          color: "#F59E0B",
          angle: -20
        },
        {
          type: "text",
          label: "Mirror the placement",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Same angle, opposite side",
        "Same pressure and motion",
        "10 placements to match first side",
        "Symmetry is key for balanced boards"
      ]
    },
    {
      id: 6,
      instruction: "Inspect your work under magnification. Check each component for alignment—pins should sit squarely on their pads. Look for any tombstoned or skewed parts.",
      duration: "45s",
      tools: ["Magnifying visor"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Check alignment",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "arrow",
          label: "Scan each component",
          color: "#EF4444",
          direction: "across"
        }
      ],
      keyPoints: [
        "Pins centered on pads",
        "No tombstoned components",
        "No rotated or skewed parts",
        "Solder paste still wet = can adjust"
      ]
    },
    {
      id: 7,
      instruction: "Make fine adjustments—nudge any misaligned parts with the tweezers. Use decreasing pressure: firm nudge, light tap, then just a touch. The goal is sub-millimeter accuracy.",
      duration: "60s",
      tools: ["Precision tweezers"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Nudge-tap-touch pattern",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Decreasing pressure",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Decreasing force: nudge, tap, touch",
        "Lighter pressure each pass",
        "Corrects misalignment",
        "Final precision adjustment"
      ]
    },
    {
      id: 8,
      instruction: "Run the conveyor belt forward to send the board to the reflow station. Verify all placements held during transport. You've just completed a micro-electronics packaging run.",
      duration: "30s",
      tools: ["Conveyor belt controller"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Final QC check",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "All placements held = success",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "All components seated and aligned",
        "No parts shifted during belt transport",
        "Board ready for reflow soldering",
        "Production-line skill mastered"
      ]
    }
  ],
  tips: [
    "Visualize the placement path before moving each component",
    "Practice the 20-degree approach in the air before touching parts",
    "The click tells you everything—listen for consistent seating",
    "Most people grip too hard—let the tweezers do the work",
    "Precision is a rhythm. Slow down and feel the process."
  ]
};

export const defaultARScenes: Record<string, typeof microElectronicsPackaging> = {
  "Micro-Electronics Conveyor Belt Packaging": microElectronicsPackaging,
  "micro-electronics": microElectronicsPackaging,
  "conveyor belt packaging": microElectronicsPackaging
};
