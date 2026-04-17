// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const dockLoadingScene = {
  lesson: "Dock Loading & Freight Staging",
  setup: {
    workspace: "Clear dock area with level floor, proper lighting, and safety markings",
    requiredTools: ["pallet jack", "dock leveler", "stretch wrap", "load bars"],
    requiredItems: []
  },
  steps: [
    {
      id: 1,
      instruction: "Inspect the dock area. Verify the dock leveler is operational, the trailer is chocked, and the area is clear of debris. Check the load plan for pallet count and weight distribution.",
      duration: "30s",
      tools: ["Load plan", "Safety checklist"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "Dock area clear",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Trailer wheels chocked",
        "Dock leveler engaged",
        "Load plan reviewed"
      ]
    },
    {
      id: 2,
      instruction: "Verify pallet labels match the BOL (Bill of Lading). Confirm piece count, weight, and destination for each pallet. Flag any discrepancies before loading.",
      duration: "45s",
      tools: ["BOL", "Pallet labels"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "BOL match confirmed",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Cross-reference BOL with pallet labels",
        "Verify weight per pallet",
        "Flag discrepancies immediately"
      ]
    },
    {
      id: 3,
      instruction: "Stage pallets in loading order—last stop loaded first (nose of trailer), first stop loaded last (near doors). Distribute weight evenly across the trailer floor.",
      duration: "60s",
      tools: ["Pallet jack", "Load plan"],
      items: [],
      overlays: [
        {
          type: "arrow",
          label: "Last stop → Nose",
          color: "#3B82F6",
          direction: "forward"
        },
        {
          type: "text",
          label: "Even weight distribution",
          color: "#3B82F6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Last stop loads first (nose)",
        "First stop loads last (tail)",
        "Balance weight left-to-right",
        "Heavy pallets on the floor"
      ]
    },
    {
      id: 4,
      instruction: "Load pallets using the pallet jack. Keep forks low and move slowly across the dock plate. Position pallets flush against trailer walls to minimize shifting.",
      duration: "90s",
      tools: ["Pallet jack", "Load bars"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "Forks low, slow speed",
          color: "#10B981",
          position: "center"
        }
      ],
      keyPoints: [
        "Forks fully inserted under pallet",
        "Slow, controlled movement",
        "Flush against walls",
        "No gaps between pallets"
      ]
    },
    {
      id: 5,
      instruction: "Secure the load with load bars and stretch wrap. Place load bars at intervals to prevent forward/backward shifting. Wrap any unstable pallets.",
      duration: "90s",
      tools: ["Load bars", "Stretch wrap"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "Load secured",
          color: "#F59E0B",
          position: "center"
        }
      ],
      keyPoints: [
        "Load bars at key intervals",
        "Stretch wrap loose pallets",
        "No gaps that allow shifting",
        "Test stability before closing"
      ]
    },
    {
      id: 6,
      instruction: "Perform a final walk-around inspection. Verify pallet count matches BOL, load is stable, and nothing is damaged. Sign off on the BOL and note any exceptions.",
      duration: "45s",
      tools: ["BOL", "Inspection checklist"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "Final inspection",
          color: "#EF4444",
          position: "center"
        }
      ],
      keyPoints: [
        "Count matches BOL",
        "No visible damage",
        "Load is stable and secured",
        "Sign and note exceptions"
      ]
    },
    {
      id: 7,
      instruction: "Close trailer doors and apply the seal. Record the seal number on the BOL. Disengage the dock leveler and remove wheel chocks only when driver is ready to depart.",
      duration: "30s",
      tools: ["Trailer seal", "BOL"],
      items: [],
      overlays: [
        {
          type: "text",
          label: "Seal applied",
          color: "#10B981",
          position: "center"
        }
      ],
      keyPoints: [
        "Record seal number on BOL",
        "Doors fully latched",
        "Chocks removed last",
        "Dock loading complete"
      ]
    }
  ],
  tips: [
    "Always review the load plan before touching freight",
    "Weight distribution prevents trailer sway on the road",
    "Last stop in, first stop out—plan your load sequence",
    "When in doubt, re-check the BOL",
    "Safety first—never rush a load."
  ]
};

export const defaultARScenes: Record<string, typeof dockLoadingScene> = {
  "Dock Loading & Freight Staging": dockLoadingScene,
  "dock loading": dockLoadingScene,
  "freight staging": dockLoadingScene
};
