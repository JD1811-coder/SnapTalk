const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"SnapTalk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP for Password Reset",
    html: `
      <h3>SnapTalk Admin Reset Password</h3>
      <p>Your OTP is:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
