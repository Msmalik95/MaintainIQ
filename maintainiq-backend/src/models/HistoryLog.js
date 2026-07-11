import mongoose from "mongoose";

const historyLogSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    // Optional – links to the related issue if applicable
    issueId: {
      type: String,
      default: "",
    },

    // Human-readable actor string (e.g. "Administrator", "Alice Miller (Technician)")
    actor: {
      type: String,
      required: true,
    },

    // Short action label (e.g. "Issue Reported", "Assigned Technician", "Maintenance Resolved")
    action: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // we manage `date` manually to match frontend behavior
  },
);

export default mongoose.model("HistoryLog", historyLogSchema);
