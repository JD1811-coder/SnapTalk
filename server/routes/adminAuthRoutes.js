const express = require("express");
const router = express.Router();
const { adminLogin, adminRegister,adminVerify,sendResetOtp,verifyResetOtp} = require("../controller/adminAuthController");

router.post("/register", adminRegister); 
router.post("/login", adminLogin);
router.get("/verify", adminVerify); 

router.post('/send-reset-otp', sendResetOtp);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', verifyResetOtp);

module.exports = router;
