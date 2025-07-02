const jwt = require("jsonwebtoken");

const adminProtect = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token)
    return res.status(401).json({ message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    console.error("🔥 Invalid admin token:", err);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = adminProtect;
