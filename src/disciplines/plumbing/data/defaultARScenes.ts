// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const copperPipeCutDeburrDryFit = {
  lesson: "Copper Pipe Cut, Deburr, and Dry-Fit Alignment",
  setup: {
    workspace: "Clean, stable bench with copper pipe secured in a virtual vise",
    requiredTools: ["copper pipe", "pipe cutter", "deburring tool", "bench vise", "marker", "fitting"],
    requiredMaterials: []
  },
  steps: [
    {
      id: 1,
      instruction: "Secure the copper pipe in the vise and mark your cut line. Confirm the pipe cannot shift before cutting.",
      duration: "30s",
      tools: ["Copper pipe", "Bench vise", "Marker"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Pipe secured",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Pipe firmly clamped",
        "Cut line clearly visible",
        "Stable workspace before starting"
      ]
    },
    {
      id: 2,
      instruction: "Place the pipe cutter wheel directly on the marked line. Keep the cutter body square to the pipe so the cut stays true.",
      duration: "45s",
      tools: ["Pipe cutter", "Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "line",
          label: "90° to pipe axis",
          color: "#F59E0B",
          angle: 90
        },
        {
          type: "text",
          label: "Square alignment",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Wheel centered on the mark",
        "Cutter remains square",
        "Start with light pressure"
      ]
    },
    {
      id: 3,
      instruction: "Rotate the cutter smoothly around the pipe to score the line. Maintain even motion and keep the wheel on track.",
      duration: "60s",
      tools: ["Pipe cutter", "Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "arrow",
          label: "Rotate around pipe",
          color: "#3B82F6",
          direction: "forward"
        },
        {
          type: "line",
          label: "Cut path",
          color: "#3B82F6",
          angle: 0
        }
      ],
      keyPoints: [
        "Smooth, controlled rotation",
        "Keep wheel on the cut line",
        "Consistency over speed",
        "Even pressure each turn"
      ]
    },
    {
      id: 4,
      instruction: "Continue the tighten-rotate sequence for 8 to 10 turns. Count each turn and keep pressure steady.",
      duration: "90s",
      tools: ["Pipe cutter", "Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "8-10 turns",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Steady pressure",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Count each full turn",
        "Small tighten increments",
        "Consistent cutter pressure",
        "Smooth cutting rhythm"
      ]
    },
    {
      id: 5,
      instruction: "Finish the cut with controlled rotations until the pipe separates cleanly. Do not force the final breakthrough.",
      duration: "90s",
      tools: ["Pipe cutter", "Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "line",
          label: "Maintain square cut",
          color: "#F59E0B",
          angle: 90
        },
        {
          type: "text",
          label: "Controlled finish",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Stay square through the final turns",
        "Avoid forcing the cutter",
        "Clean separation is the goal",
        "Control movement at breakthrough"
      ]
    },
    {
      id: 6,
      instruction: "Inspect the cut edge and carefully feel for burrs on the inner lip before deburring.",
      duration: "45s",
      tools: ["Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Check burrs",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "arrow",
          label: "Inspect inner lip",
          color: "#EF4444",
          direction: "across"
        }
      ],
      keyPoints: [
        "Check inside edge first",
        "Check outside edge second",
        "Identify rough spots before cleanup",
        "Handle sharp edges carefully"
      ]
    },
    {
      id: 7,
      instruction: "Use the deburring tool on the inner edge, then clean the outer edge with lighter finishing passes until smooth.",
      duration: "60s",
      tools: ["Deburring tool", "Copper pipe"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Deburr + smooth",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Light finishing passes",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Remove inner burr completely",
        "Break the outer edge cleanly",
        "Use lighter pressure on final passes",
        "Smooth edge for proper fit"
      ]
    },
    {
      id: 8,
      instruction: "Dry-fit the pipe into the fitting and verify full seating with straight alignment. A full seat confirms success.",
      duration: "30s",
      tools: ["Copper pipe", "Fitting"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Dry-fit test",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Full seat = success",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Pipe seats fully in fitting",
        "Alignment remains straight",
        "No burr interference",
        "Connection ready for next step"
      ]
    }
  ],
  tips: [
    "Visualize the cut path before rotating the cutter",
    "Keep the cutter square from first turn to last",
    "Count turns to maintain consistent rhythm",
    "Most mistakes come from forcing pressure—stay controlled",
    "Smooth prep makes the fit easy"
  ]
};

export const defaultARScenes = {
  "Copper Pipe Cut, Deburr, and Dry-Fit Alignment": copperPipeCutDeburrDryFit,
  "copper pipe": copperPipeCutDeburrDryFit,
  "pipe deburr": copperPipeCutDeburrDryFit
};
