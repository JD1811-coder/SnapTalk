const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, email, password: hashedPassword });

    res.status(201).json({ message: "Admin registered", adminId: admin._id });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, admin: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
