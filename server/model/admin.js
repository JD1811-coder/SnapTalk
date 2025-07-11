const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetOtp: String,
    resetOtpExpire: Date,
  },
  { timestamps: true }
);
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    console.log("Password NOT modified, skipping hash");
    return next();
  }

  console.log("Password modified, hashing...");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Method to compare password during login
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
