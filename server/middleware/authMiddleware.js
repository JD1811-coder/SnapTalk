const jwt = require("jsonwebtoken");
const User = require("../model/user");
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // If token is in Authorization header
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    // ✅ If token is in cookie
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isDisabled) {
      return res
        .status(403)
        .json({ message: "Your account is disabled. Contact admin." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
