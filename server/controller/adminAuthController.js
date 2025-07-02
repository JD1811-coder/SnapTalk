const Admin = require("../model/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("Admin Register Data:", { username, email, password });

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
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

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res
      .cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        admin: { id: admin._id, username: admin.username, email: admin.email },
      });
  } catch (err) {
    console.error("🔥 Admin login error:", err);
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
