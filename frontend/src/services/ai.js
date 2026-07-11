// AI Issue Triage Service for MaintainIQ

// Fallback rule-based parsing engine when Gemini is unavailable or not configured
function localFallbackTriage(complaint, assetCategory = "") {
  const text = complaint.toLowerCase();
  
  let title = "Reported Maintenance Issue";
  let category = assetCategory || "General Maintenance";
  let priority = "Medium";
  let causes = ["General wear and tear", "Component degradation"];
  let checks = ["Visually inspect the unit for loose parts or external damage.", "Verify if the equipment is properly plugged into power."];
  let hazardWarning = false;

  // Keyword check: Electrical/Flickering/Sparking
  if (text.includes("flicker") || text.includes("hdmi") || text.includes("display") || text.includes("screen") || text.includes("projector")) {
    title = "Display Flickering and HDMI Connection Instability";
    category = "AV Equipment";
    priority = "Medium";
    causes = [
      "Damaged or low-quality HDMI cable",
      "Loose HDMI input port on the projector receiver board",
      "Resolution mismatch between laptop source and projector native resolution"
    ];
    checks = [
      "Unplug HDMI cable, check for bent connector pins, and reconnect securely.",
      "Test with an alternate device or cable to isolate the source.",
      "Perform a factory reset of the display settings using the remote control."
    ];
  } 
  // Keyword check: AC/Water/Cooling
  else if (text.includes("ac") || text.includes("air conditioner") || text.includes("leak") || text.includes("cool") || text.includes("water") || text.includes("noise")) {
    title = "AC Water Leakage and Cooling Inefficiency";
    category = "HVAC";
    priority = "High";
    causes = [
      "Clogged condensate drain line backing up the drain pan",
      "Dirty air filters restricting airflow and causing evaporator coil icing",
      "Low refrigerant level due to potential micro-leak"
    ];
    checks = [
      "Check if water is leaking near electrical outlets. Turn off power immediately if so!",
      "Inspect filter for excessive dust build-up and clean/replace if necessary.",
      "Listen for compressor operations. Ensure air intakes and vents are clear."
    ];
  } 
  // Keyword check: Jam/Printer/Ink
  else if (text.includes("printer") || text.includes("jam") || text.includes("paper") || text.includes("ink") || text.includes("print")) {
    title = "Printer Paper Jam & Feed Roller Failure";
    category = "IT Hardware";
    priority = "Low";
    causes = [
      "Worn out or dirty paper pickup rollers",
      "Use of damp, folded, or incorrect weight paper stock",
      "Misaligned paper guide sliders in Tray 2"
    ];
    checks = [
      "Open rear cover and carefully pull out jammed sheets in the direction of paper flow.",
      "Clean rubber feed rollers with a lint-free damp cloth.",
      "Verify paper guides in tray are flush against paper stack but not overtightened."
    ];
  }
  // Keyword check: Elevator/Stuck/Alarm
  else if (text.includes("elevator") || text.includes("stuck") || text.includes("door") || text.includes("lift")) {
    title = "Elevator Door Obstructed / Levelling Inaccuracy";
    category = "Facility";
    priority = "Critical";
    hazardWarning = true;
    causes = [
      "Optical light curtain sensor failure or debris blocking the track",
      "Levelling sensor misalignment causing offset floor stopping",
      "Mechanical friction on door guide rail tracks"
    ];
    checks = [
      "DO NOT attempt mechanical adjustments inside the elevator shaft.",
      "Check door tracks for visible debris or blocks (do not stand in doorway).",
      "Ensure emergency phone and alarm bells are active. Contact primary elevator service provider immediately."
    ];
  }
  // Keyword check: Microscope/Lens/Focus
  else if (text.includes("microscope") || text.includes("focus") || text.includes("lens") || text.includes("light") || text.includes("blurry")) {
    title = "Microscope Focus Slippage and Lens Smudging";
    category = "Lab Equipment";
    priority = "Medium";
    causes = [
      "Coarse adjustment tension knob is too loose, causing focus drift",
      "Residue or oil on the 40x/100x high-dry lenses",
      "LED lamp bulb degradation or loose contact pin"
    ];
    checks = [
      "Use lens paper with 99% isopropyl alcohol to carefully wipe optical surfaces (never use tissues).",
      "Adjust tension ring located inside the coarse adjustment knob to secure focus.",
      "Inspect power adapter cable connection and dimmer switch operation."
    ];
  }

  // Safety Warnings for dangerous terms
  const dangerousTerms = ["fire", "smoke", "electrical spark", "gas leak", "shock", "voltage", "elevator stuck", "chemical spill"];
  if (dangerousTerms.some(term => text.includes(term))) {
    priority = "Critical";
    hazardWarning = true;
    checks.unshift("SAFETY WARNING: High risk hazard detected. Evacuate local area if unsafe, disconnect main breaker if electrical, and call emergency contacts immediately. Only qualified, certified personnel should inspect.");
  }

  return {
    title,
    category,
    priority,
    possibleCauses: causes,
    initialChecks: checks,
    isAISuggested: true,
    isAIEdited: false,
    isMocked: true,
    hazardWarning
  };
}

export async function runAITriage(complaint, assetContext = {}) {
  // Get API key from local storage
  const settings = JSON.parse(localStorage.getItem("maintainiq_settings") || "{}");
  const apiKey = settings.geminiApiKey;
  const lag = settings.networkLagSim || 0;

  // Simulate user-defined lag if specified (great for demoing loading spinner states!)
  if (lag > 0) {
    await new Promise(resolve => setTimeout(resolve, lag * 1000));
  }

  if (!apiKey) {
    console.log("No Gemini API key found, running high-fidelity local keyword triage fallback.");
    return localFallbackTriage(complaint, assetContext.category);
  }

  try {
    const assetString = JSON.stringify({
      name: assetContext.name,
      code: assetContext.code,
      category: assetContext.category,
      location: assetContext.location,
      condition: assetContext.condition,
      lastService: assetContext.lastServiceDate,
      recentHistory: assetContext.recentHistory || []
    });

    const prompt = `You are the MaintainIQ Asset Maintenance AI assistant.
Your task is to analyze a natural-language maintenance complaint about a physical asset and generate a structured JSON object containing professional diagnostic details.

CONTEXT OF ASSET BEING REPORTED:
${assetString}

USER COMPLAINT:
"${complaint}"

Please perform triage. You MUST respond with a valid JSON object ONLY. Do not wrap the JSON in markdown code blocks like \`\`\`json. Do not output any chat explanation, only the JSON block itself.

The JSON object structure must be EXACTLY as follows:
{
  "title": "A short, professional title summarizing the problem (max 8 words)",
  "category": "Suggested category (e.g., AV Equipment, HVAC, IT Hardware, Lab Equipment, Facility, Plumbing, Electrical)",
  "priority": "Suggested priority (Low, Medium, High, Critical)",
  "possibleCauses": [
    "Cause 1 (specific to asset type and symptoms)",
    "Cause 2",
    "Cause 3"
  ],
  "initialChecks": [
    "Check 1: Safe, non-invasive diagnostic check the user can do first",
    "Check 2: Another check",
    "Check 3: Another check"
  ],
  "hazardWarning": true/false (Set to true if there is a severe safety risk like fire, smoke, electrical shock, gas leak, structural danger, or high-voltage hazard)
}

SAFETY RULES:
1. Do not provide unsafe instructions for high-voltage, high-pressure mechanical, heavy fire, elevator shaft entry, or dangerous chemicals.
2. If priority is "Critical" or "hazardWarning" is true, the first item in "initialChecks" MUST be: "SAFETY ALERT: Turn off main supply/evacuate if hazardous. Do not touch. Contact certified professional technician immediately."
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: status ${response.status}`);
    }

    const resData = await response.json();
    const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty candidate response text from Gemini API.");
    }

    // Clean JSON content just in case gemini outputs backticks
    let jsonText = candidateText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "").trim();
    }

    const result = JSON.parse(jsonText);
    return {
      ...result,
      isAISuggested: true,
      isAIEdited: false,
      isMocked: false
    };
  } catch (error) {
    console.error("Gemini API call failed, falling back to local parsing engine.", error);
    const fallback = localFallbackTriage(complaint, assetContext.category);
    fallback.fallbackNotice = `AI Fallback active (API Error: ${error.message})`;
    return fallback;
  }
}
