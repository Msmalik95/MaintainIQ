import User from "../models/User.js";

// GET /api/technicians
// Returns all users with role = 'technician'
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: "technician" }).select("-password -resetPasswordPin -resetPasswordExpiry");
    return res.json({ success: true, technicians });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
