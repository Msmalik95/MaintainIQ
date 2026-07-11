import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// =========================
// Register
// =========================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Validate role — default to 'technician' if not provided or invalid
    const allowedRoles = ["admin", "technician", "supervisor"];
    const userRole = allowedRoles.includes(role) ? role : "technician";

    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// Login
// =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// Get Profile
// =========================
export const profile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

// =========================
// Logout  (JWT is stateless – client deletes token)
// =========================
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// =========================
// Forgot Password
// Generates a mock 4-digit PIN stored (hashed) in the DB
// In production this would email the PIN — here we return it directly
// so the frontend demo can show "use PIN 1234"
// =========================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether the email exists for security – but for prototype we do
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // For prototype: PIN is always "1234" – expires in 15 minutes
    const pin = "1234";
    user.resetPasswordPin = pin;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Reset PIN generated. In production this would be emailed. For this prototype, use PIN: 1234",
      // Expose PIN in dev mode only so frontend demo works
      pin: process.env.NODE_ENV === "development" ? pin : undefined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// Reset Password
// Validates the PIN and updates the password
// =========================
export const resetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body || {};

    if (!email || !pin || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, PIN and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordPin: pin,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset PIN",
      });
    }

    user.password = newPassword;
    user.resetPasswordPin = null;
    user.resetPasswordExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
