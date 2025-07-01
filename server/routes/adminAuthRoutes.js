const express = require("express");
const router = express.Router();
const { adminLogin, adminRegister } = require("../controller/adminAuthController");

router.post("/register", adminRegister); // optional, or hardcode first admin manually
router.post("/login", adminLogin);

module.exports = router;
