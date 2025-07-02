const express = require("express");
const router = express.Router();
const { adminLogin, adminRegister,adminVerify } = require("../controller/adminAuthController");

router.post("/register", adminRegister); // optional, or hardcode first admin manually
router.post("/login", adminLogin);
router.get("/verify", adminVerify); 
module.exports = router;
