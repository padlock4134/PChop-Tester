// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const teeJointSMAW = {
  lesson: "Basic Tee Joint — Stick Welding (SMAW)",
  setup: {
    workspace: "Welding booth with proper ventilation, welding table, and fire-safe area",
    requiredTools: ["Stick welder (SMAW)", "E7018 electrodes (1/8\")", "Welding helmet (auto-darkening)", "Leather gloves", "Chipping hammer", "Wire brush", "C-clamps", "Framing square"],
    requiredMaterials: ["Two pieces 3/16\" mild steel plate (A36)", "Soapstone"]
  },
  steps: [
    {
      id: 1,
      instruction: "Inspect your PPE: auto-darkening helmet, leather gloves, welding jacket, safety glasses underneath, and steel-toe boots. Check that your welding area is clear of flammables and your fire extinguisher is accessible.",
      duration: "30s",
      tools: ["Welding helmet", "Gloves", "Jacket"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "PPE Check Complete",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Helmet lens shade 10–12 for SMAW",
        "No exposed skin — sparks cause burns",
        "Fire extinguisher within arm's reach",
        "Ventilation on and flowing"
      ]
    },
    {
      id: 2,
      instruction: "Prepare your joint. Clean both steel plates with a wire brush to remove mill scale and contaminants. Use soapstone to mark a straight line along the base plate where the vertical piece will sit.",
      duration: "45s",
      tools: ["Wire brush", "Soapstone", "Framing square"],
      materials: ["3/16\" mild steel plates"],
      overlays: [
        {
          type: "line",
          label: "Soapstone line",
          color: "#F59E0B",
          angle: 0
        },
        {
          type: "text",
          label: "Clean to bright metal",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Clean 1\" on each side of the joint",
        "Remove all mill scale and rust",
        "Square the vertical piece to 90°",
        "Mark placement with soapstone"
      ]
    },
    {
      id: 3,
      instruction: "Fit up the tee joint. Stand the vertical plate on edge against the base plate at 90 degrees. Use your framing square to verify the angle. Clamp both pieces securely to the table.",
      duration: "60s",
      tools: ["Framing square", "C-clamps"],
      materials: ["3/16\" mild steel plates"],
      overlays: [
        {
          type: "line",
          label: "90° angle",
          color: "#3B82F6",
          angle: 90
        },
        {
          type: "text",
          label: "Tight fit-up, no gap",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "90-degree angle is critical",
        "No gap between plates",
        "Clamp firmly — parts must not move",
        "Verify square on both ends"
      ]
    },
    {
      id: 4,
      instruction: "Set your machine. For 1/8\" E7018 on 3/16\" plate, set amperage to 115–125 amps DCEP (reverse polarity). Insert the electrode into the stinger at a comfortable angle.",
      duration: "45s",
      tools: ["Stick welder", "E7018 electrode"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "115–125 amps DCEP",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Electrode in stinger",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "DCEP (electrode positive) for E7018",
        "115–125A range for 1/8\" rod",
        "Check ground clamp connection",
        "Electrode angle: 45° into the joint"
      ]
    },
    {
      id: 5,
      instruction: "Tack weld both ends. Strike the arc by scratching the electrode on the plate, then place small tacks (about 1/2\" long) at each end of the joint. These hold the pieces in position during welding.",
      duration: "60s",
      tools: ["Stick welder", "E7018 electrode"],
      materials: [],
      overlays: [
        {
          type: "arrow",
          label: "Scratch to strike",
          color: "#F59E0B",
          direction: "forward"
        },
        {
          type: "text",
          label: "Tack both ends",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Scratch start — like striking a match",
        "Tacks are 1/2\" long max",
        "One tack each end",
        "Recheck 90° after tacking"
      ]
    },
    {
      id: 6,
      instruction: "Run the fillet weld. Hold the electrode at 45° into the joint and 10–15° drag angle. Travel speed should produce a bead about 3/8\" wide. Listen for a steady crackle — that's your arc length telling you it's right.",
      duration: "90s",
      tools: ["Stick welder", "E7018 electrode"],
      materials: [],
      overlays: [
        {
          type: "line",
          label: "45° work angle",
          color: "#EF4444",
          angle: 45
        },
        {
          type: "line",
          label: "10–15° drag angle",
          color: "#EF4444",
          angle: 12
        }
      ],
      keyPoints: [
        "45° work angle splits the joint evenly",
        "10–15° drag angle (push the puddle slightly)",
        "Steady crackle = correct arc length",
        "Consistent travel speed — don't rush"
      ]
    },
    {
      id: 7,
      instruction: "Clean the weld. Use your chipping hammer to remove the slag, then wire brush the bead clean. Inspect visually: look for uniform width, consistent ripple pattern, and no undercut or porosity.",
      duration: "60s",
      tools: ["Chipping hammer", "Wire brush"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Chip slag → Wire brush",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Visual inspection",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Chip all slag before inspecting",
        "Wire brush for final clean",
        "Look for even bead width (~3/8\")",
        "No undercut, porosity, or overlap"
      ]
    },
    {
      id: 8,
      instruction: "Flip the assembly and weld the other side. Same settings, same technique. When both fillets are done, you've completed a sound tee joint — the foundation of structural welding.",
      duration: "90s",
      tools: ["Stick welder", "E7018 electrode", "Chipping hammer", "Wire brush"],
      materials: [],
      overlays: [
        {
          type: "text",
          label: "Weld second side",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Tee joint complete",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Same 45° work angle, opposite side",
        "Same amperage and travel speed",
        "Clean and inspect second bead",
        "Structural tee joint mastered"
      ]
    }
  ],
  tips: [
    "Listen to the arc — a steady crackle means correct arc length",
    "Practice striking the arc on scrap before your real joint",
    "If the rod sticks, twist and pull quickly to break free",
    "Watch the puddle, not the arc — your eyes follow the weld pool",
    "Welding is a rhythm. Find yours and stay consistent."
  ]
};

export const defaultARScenes: Record<string, typeof teeJointSMAW> = {
  "Basic Tee Joint — Stick Welding (SMAW)": teeJointSMAW,
  "tee joint": teeJointSMAW,
  "stick welding": teeJointSMAW,
  "smaw": teeJointSMAW
};
