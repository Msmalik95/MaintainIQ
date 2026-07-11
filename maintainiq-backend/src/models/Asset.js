import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    // Short human-readable unique code printed on QR labels (e.g. "CR-PROJ-01")
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "General Maintenance",
    },

    location: {
      type: String,
      default: "",
    },

    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
      default: "Good",
    },

    status: {
      type: String,
      enum: [
        "Operational",
        "Issue Reported",
        "Under Inspection",
        "Under Maintenance",
        "Out of Service",
        "Retired",
      ],
      default: "Operational",
    },

    serialNumber: {
      type: String,
      default: "",
    },

    purchaseCost: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },

    lastServiceDate: {
      type: String, // ISO date string like "2026-05-10"
      default: "",
    },

    nextServiceDate: {
      type: String,
      default: "",
    },

    // Reference to assigned technician's User _id
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Asset", assetSchema);
