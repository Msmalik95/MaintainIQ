import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    // Asset code this issue belongs to (e.g. "CR-PROJ-01")
    assetCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    category: {
      type: String,
      default: "General Maintenance",
    },

    reporterName: {
      type: String,
      default: "Anonymous",
    },

    reporterContact: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Reported",
        "Assigned",
        "Inspection Started",
        "Maintenance In Progress",
        "Waiting for Parts",
        "Resolved",
        "Closed",
        "Reopened",
      ],
      default: "Reported",
    },

    // Technician User _id
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    evidenceImage: {
      type: String,
      default: "",
    },

    inspectionNotes: {
      type: String,
      default: "",
    },

    workPerformed: {
      type: String,
      default: "",
    },

    partsReplaced: {
      type: String,
      default: "",
    },

    maintenanceCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    completionDate: {
      type: String,
      default: "",
    },

    // AI triage tracking flags
    isAISuggested: {
      type: Boolean,
      default: false,
    },

    isAIEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Issue", issueSchema);
