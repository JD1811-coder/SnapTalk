const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");

const adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      res.status(401).json({ message: "Admin not authorized", error: err.message });
    }
  } else {
    res.status(401).json({ message: "No token, admin not authorized" });
  }
};

module.exports = adminProtect;
