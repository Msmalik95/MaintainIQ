import Asset from "../models/Asset.js";
import HistoryLog from "../models/HistoryLog.js";

// Helper: log a history entry
const addHistory = async (assetCode, actor, action, notes, issueId = "") => {
  await HistoryLog.create({ assetCode, actor, action, notes, issueId, date: new Date() });
};

// GET /api/assets
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate("technicianId", "name email").sort({ createdAt: -1 });
    return res.json({ success: true, assets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/assets/:code
export const getAssetByCode = async (req, res) => {
  try {
    const asset = await Asset.findOne({ code: req.params.code.toUpperCase() }).populate("technicianId", "name email");
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    return res.json({ success: true, asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/assets
export const createAsset = async (req, res) => {
  try {
    const data = req.body;
    if (!data.code || !data.name) {
      return res.status(400).json({ success: false, message: "Code and name are required" });
    }

    const exists = await Asset.findOne({ code: data.code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: `Asset code "${data.code}" already exists` });
    }

    const asset = await Asset.create({ ...data, code: data.code.toUpperCase() });

    const actorName = req.user ? req.user.name : "Administrator";
    await addHistory(
      asset.code,
      actorName,
      "Asset Registered",
      `Registered new asset "${asset.name}" at location "${asset.location}"`,
    );

    return res.status(201).json({ success: true, asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/assets/:code
export const updateAsset = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const asset = await Asset.findOneAndUpdate(
      { code },
      { $set: req.body },
      { new: true, runValidators: true },
    ).populate("technicianId", "name email");

    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });

    return res.json({ success: true, asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/assets/:code
export const deleteAsset = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const asset = await Asset.findOneAndDelete({ code });
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    return res.json({ success: true, message: "Asset deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
