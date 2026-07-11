import mongoose from "mongoose";

// One settings document per deployment (singleton pattern via upsert)
const settingsSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      default: "MaintainIQ Central Facilities",
    },

    // Gemini API key stored server-side for deployments that want server-managed AI
    geminiApiKey: {
      type: String,
      default: "",
    },

    // Simulated network lag (seconds) for demo/prototype mode
    networkLagSim: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Settings", settingsSchema);
