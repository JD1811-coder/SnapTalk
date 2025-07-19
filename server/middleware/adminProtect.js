const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");

const adminProtect = async (req, res, next) => {
  console.log("🍪 Incoming cookies:", req.cookies);
const token = req.cookies.adminToken;
console.log("🔑 Received token:", token);

  if (!token) {
    console.log("❌ No adminToken found in cookies");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Decoded token:", decoded);

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      console.log("❌ Admin not found for decoded id:", decoded.id);
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin;
    console.log("✅ Admin authenticated:", admin.username);
    next();
  } catch (err) {
    console.error("🔥 Invalid admin token:", err.message);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = adminProtect;
