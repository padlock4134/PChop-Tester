// Default AR practice scenes for instant demo loading
// AI can still generate custom scenes, but these load instantly

export const obdDiagnosticScan = {
  lesson: "Basic OBD-II Diagnostic Scan",
  setup: {
    workspace: "Vehicle parked on level surface, engine off, key in ignition",
    requiredTools: ["OBD-II scan tool", "Vehicle service manual", "Notepad/tablet", "Safety glasses"],
    requiredIngredients: []
  },
  steps: [
    {
      id: 1,
      instruction: "Locate the OBD-II diagnostic port. It's typically under the dashboard on the driver's side, near the steering column. Some vehicles have it behind a small cover panel.",
      duration: "30s",
      tools: ["OBD-II scan tool"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "OBD-II port location",
          color: "#3B82F6",
          position: "center"
        }
      ],
      keyPoints: [
        "Usually under driver-side dash",
        "16-pin trapezoidal connector",
        "Check behind cover panels if not visible",
        "Engine should be OFF"
      ]
    },
    {
      id: 2,
      instruction: "Connect the OBD-II scan tool to the diagnostic port. The connector only fits one way—align the pins and push firmly until it clicks. Do NOT force it.",
      duration: "30s",
      tools: ["OBD-II scan tool"],
      ingredients: [],
      overlays: [
        {
          type: "arrow",
          label: "Align and insert",
          color: "#F59E0B",
          direction: "forward"
        },
        {
          type: "text",
          label: "Listen for click",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "Connector is keyed—one orientation only",
        "Push firmly but don't force",
        "Should click into place",
        "Scan tool should power on from port"
      ]
    },
    {
      id: 3,
      instruction: "Turn the ignition to the ON position (do not start the engine). The scan tool should power up and begin communicating with the vehicle's ECU. Wait for the initial handshake.",
      duration: "45s",
      tools: ["OBD-II scan tool", "Vehicle ignition"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Key ON, Engine OFF",
          color: "#3B82F6",
          position: "center"
        },
        {
          type: "text",
          label: "Wait for ECU handshake",
          color: "#3B82F6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Key ON, Engine OFF (KOEO)",
        "Dashboard lights should illuminate",
        "Scan tool displays vehicle info",
        "Wait for communication confirmation"
      ]
    },
    {
      id: 4,
      instruction: "Select 'Read Codes' or 'Diagnostic Trouble Codes (DTCs)' from the scan tool menu. The tool will query all vehicle systems and retrieve any stored trouble codes.",
      duration: "60s",
      tools: ["OBD-II scan tool"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Read DTCs",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Record all codes",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Navigate to Read Codes / DTCs",
        "Record ALL codes displayed",
        "Note pending vs. confirmed codes",
        "Check for freeze frame data"
      ]
    },
    {
      id: 5,
      instruction: "Record each DTC and its description. Example: P0301 = Cylinder 1 Misfire. The first character tells you the system: P = Powertrain, B = Body, C = Chassis, U = Network.",
      duration: "60s",
      tools: ["OBD-II scan tool", "Notepad/tablet"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "P=Powertrain B=Body C=Chassis U=Network",
          color: "#F59E0B",
          position: "center"
        },
        {
          type: "text",
          label: "Record code + description",
          color: "#F59E0B",
          position: "top"
        }
      ],
      keyPoints: [
        "P = Powertrain, B = Body, C = Chassis, U = Network",
        "0 = Generic (SAE), 1 = Manufacturer specific",
        "Write down every code with description",
        "Note which codes are pending vs. stored"
      ]
    },
    {
      id: 6,
      instruction: "Check live data / sensor readings. Navigate to the Live Data stream on your scan tool. Monitor key PIDs: engine RPM, coolant temp, O2 sensors, fuel trims, and MAF readings.",
      duration: "90s",
      tools: ["OBD-II scan tool"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Monitor live PIDs",
          color: "#8B5CF6",
          position: "center"
        },
        {
          type: "text",
          label: "Compare to spec values",
          color: "#8B5CF6",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Engine RPM should be stable at idle",
        "Coolant temp should reach operating range",
        "O2 sensors should oscillate (0.1V–0.9V)",
        "Fuel trims within ±10% is normal"
      ]
    },
    {
      id: 7,
      instruction: "Cross-reference DTCs with the vehicle service manual. Look up each code's possible causes, diagnostic steps, and repair procedures. Prioritize codes by severity.",
      duration: "60s",
      tools: ["Vehicle service manual", "Notepad/tablet"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Cross-reference service manual",
          color: "#EF4444",
          position: "center"
        },
        {
          type: "text",
          label: "Prioritize by severity",
          color: "#EF4444",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Look up each DTC in service manual",
        "Identify possible causes",
        "Note recommended diagnostic steps",
        "Prioritize safety-critical codes first"
      ]
    },
    {
      id: 8,
      instruction: "Disconnect the scan tool, turn the ignition OFF, and document your findings. Create a diagnostic summary with codes found, live data observations, and recommended next steps.",
      duration: "30s",
      tools: ["OBD-II scan tool", "Notepad/tablet"],
      ingredients: [],
      overlays: [
        {
          type: "text",
          label: "Document findings",
          color: "#10B981",
          position: "center"
        },
        {
          type: "text",
          label: "Diagnostic complete",
          color: "#10B981",
          position: "bottom"
        }
      ],
      keyPoints: [
        "Turn ignition OFF before disconnecting",
        "Remove scan tool gently",
        "Complete diagnostic report",
        "Recommend next diagnostic or repair steps"
      ]
    }
  ],
  tips: [
    "Always start diagnostics with a visual inspection first",
    "Never clear codes until you've recorded them all",
    "Freeze frame data shows conditions when the code was set—invaluable for intermittent issues",
    "A code tells you WHAT failed, not WHY—further diagnosis is always needed",
    "Keep your scan tool firmware updated for the latest vehicle coverage"
  ]
};

export const defaultARScenes: Record<string, typeof obdDiagnosticScan> = {
  "Basic OBD-II Diagnostic Scan": obdDiagnosticScan,
  "obd-scan": obdDiagnosticScan,
  "diagnostic scan": obdDiagnosticScan
};
