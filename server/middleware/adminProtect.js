const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin"); // Adjust path as needed

const adminProtect = async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token)
    return res.status(401).json({ message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("🔥 Invalid admin token:", err);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = adminProtect;
