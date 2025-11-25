// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const whetstoneSharpening = {
  lesson: "Traditional Whetstone Knife Sharpening",
  setup: {
    workspace: "Clean, stable surface with damp towel underneath whetstone",
    requiredTools: ["8-inch chef's knife", "1000/6000 grit whetstone", "bowl of water", "damp towel"],
    requiredIngredients: []
  },
  steps: [
    {
      id: 1,
      instruction: "Soak your whetstone in water for 10 minutes. The stone should feel heavy and fully saturated. Place a damp towel under the stone to prevent slipping.",
      duration: "30s",
      tools: ["Whetstone", "Bowl of water", "Damp towel"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Stone fully saturated",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Stone should be completely wet",
        "Damp towel prevents sliding",
        "Stable, comfortable workspace height"
      ]
    },
    {
      id: 2,
      instruction: "Hold the knife with your dominant hand. Place the blade against the stone at a 20-degree angle. This is critical—visualize a matchbook under the spine of the blade.",
      duration: "45s",
      tools: ["Chef's knife", "Whetstone"],
      ingredients: [],
      overlays: [
        {
          type: "line",
          label: "20° angle",
          color: "#F59E0B",
          angle: 20
        },
        {
          type: "text",
          label: "Matchbook thickness",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "20-degree angle is crucial",
        "Consistent angle throughout",
        "Firm but not white-knuckle grip"
      ]
    },
    {
      id: 3,
      instruction: "Using light to moderate pressure, sweep the blade from heel to tip across the stone. Imagine you're trying to shave a thin layer off the stone. Keep the angle consistent.",
      duration: "60s",
      tools: ["Chef's knife", "Whetstone"],
      ingredients: [],
      overlays: [
        {
          type: "arrow",
          label: "Heel to tip motion",
          color: "#3B82F6",
          direction: "forward"
        },
        {
          type: "line",
          label: "Sweeping path",
          color: "#3B82F6",
          angle: 0
        }
      ],
      keyPoints: [
        "Smooth, controlled motion",
        "Let the stone do the work",
        "Maintain 20° angle throughout stroke",
        "Full blade contact—heel to tip"
      ]
    },
    {
      id: 4,
      instruction: "Complete 10 strokes on this side. Count them out loud. Listen to the sound—it should be consistent, like a whisper across the stone.",
      duration: "90s",
      tools: ["Chef's knife", "Whetstone"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "10 strokes",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Listen for consistency",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Count each stroke",
        "Consistent pressure",
        "Consistent sound = consistent angle",
        "Smooth, rhythmic motion"
      ]
    },
    {
      id: 5,
      instruction: "Flip the knife over. Maintain the same 20-degree angle on the opposite side. Your hand position will feel different—that's normal. 10 more strokes, same motion.",
      duration: "90s",
      tools: ["Chef's knife", "Whetstone"],
      ingredients: [],
      overlays: [
        {
          type: "line",
          label: "20° opposite side",
          color: "#F59E0B",
          angle: -20
        },
        {
          type: "text",
          label: "Mirror the angle",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Same angle, opposite side",
        "Same pressure and motion",
        "10 strokes to match first side",
        "Symmetry is key"
      ]
    },
    {
      id: 6,
      instruction: "Feel for the burr. Run your thumb CAREFULLY perpendicular to the edge on the side you just sharpened. You should feel a tiny metal ridge—that's the burr. It means you've sharpened through to the edge.",
      duration: "45s",
      tools: ["Chef's knife"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Feel for burr",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "arrow",
          label: "Thumb perpendicular to edge",
          color: "#EF4444",
          direction: "across"
        }
      ],
      keyPoints: [
        "Move thumb AWAY from edge",
        "Tiny ridge = success",
        "Should feel it on opposite side",
        "Be careful—edge is sharp"
      ]
    },
    {
      id: 7,
      instruction: "Alternate sides with lighter pressure—5 strokes per side, then 3, then 1. This removes the burr and polishes the edge. The blade should now feel razor-sharp.",
      duration: "60s",
      tools: ["Chef's knife", "Whetstone"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "5-3-1 pattern",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Lighter pressure",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Decreasing strokes: 5, 3, 1",
        "Lighter pressure each round",
        "Removes the burr",
        "Final polish"
      ]
    },
    {
      id: 8,
      instruction: "Rinse the blade and test on paper. A sharp knife will slice through paper cleanly with no tearing. You've just mastered a centuries-old technique.",
      duration: "30s",
      tools: ["Chef's knife"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Paper test",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Clean slice = success",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Clean, smooth cut through paper",
        "No tearing or catching",
        "Blade should feel razor-sharp",
        "Old-school skill mastered"
      ]
    }
  ],
  tips: [
    "Close your eyes between steps and visualize the motion",
    "Practice the 20-degree angle in the air before touching the stone",
    "The sound tells you everything—listen for consistency",
    "Most people press too hard—let the stone do the work",
    "This is a meditation. Slow down and feel the process."
  ]
};

export const defaultARScenes = {
  "Traditional Whetstone Knife Sharpening": whetstoneSharpening,
  "whetstone": whetstoneSharpening,
  "knife sharpening": whetstoneSharpening
};
