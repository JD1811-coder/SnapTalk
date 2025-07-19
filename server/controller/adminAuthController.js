const Admin = require("../model/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
exports.adminRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("Admin Register Data:", { username, email, password });

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      username,
      email,
      password, // Pass raw password; pre-save hook will hash it
    });

    res.status(201).json({ message: "Admin registered", adminId: admin._id });
  } catch (err) {
    console.error("🔥 Admin register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login request received:", { email, password });

    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log("⛔ Admin not found");
      return res.status(400).json({ message: "Invalid credentials (no admin)" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      console.log("❌ Password incorrect");
      return res.status(400).json({ message: "Invalid credentials (wrong password)" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error("🔥 Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.adminLogout = (req, res) => {
  try {
    res.clearCookie("adminToken");
    res.json({ message: "Admin logged out" });
  } catch (err) {
    console.error("🔥 Admin logout error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
exports.adminVerify = (req, res) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true, admin: decoded });
  } catch (err) {
    console.error("🔥 Admin verify error:", err);
    res.status(401).json({ message: "Not authenticated" });
  }
};

const { sendOtpEmail } = require("../utils/emailService");

exports.sendResetOtp = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const otp = generateOtp();
  admin.resetOtp = otp;
  admin.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins expiry
  await admin.save();

  try {
    await sendOtpEmail(email, otp);
    console.log(`✅ OTP email sent to ${email}`);
    res.status(200).json({ message: "OTP sent to registered email" });
  } catch (err) {
    console.error("❌ Error sending OTP email:", err);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
};

exports.verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  const admin = await Admin.findOne({
    email,
    resetOtp: otp,
    resetOtpExpire: { $gt: Date.now() },
  });

  if (!admin) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  res.status(200).json({ message: "OTP verified" });
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const admin = await Admin.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    console.log("🔑 New password send in request:", newPassword);
    console.log("📌 Before reset, old password hash:", admin.password);

    // ✅ Manually hash the new password (skip relying on schema’s pre-save)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    // Clear OTP fields
    admin.resetOtp = undefined;
    admin.resetOtpExpire = undefined;

    await admin.save();

    console.log("✅ Password successfully reset and hashed:", admin.password);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Error during password reset:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
