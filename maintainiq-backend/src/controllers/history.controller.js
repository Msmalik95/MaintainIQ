import HistoryLog from "../models/HistoryLog.js";

// GET /api/history
export const getHistory = async (req, res) => {
  try {
    const logs = await HistoryLog.find().sort({ date: -1 });
    return res.json({ success: true, history: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/history/:assetCode
export const getHistoryForAsset = async (req, res) => {
  try {
    const logs = await HistoryLog.find({
      assetCode: req.params.assetCode.toUpperCase(),
    }).sort({ date: -1 });

    return res.json({ success: true, history: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
