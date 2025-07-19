const bcrypt = require('bcryptjs');

const enteredPassword = 'jenil@1811';
const storedHash = '$2b$10$gsRm9LubNm9Niml0sq.Hreq3op4naV/M398AUyVbfhzMrojLJyoLS';

bcrypt.compare(enteredPassword, storedHash)
  .then(result => {
    console.log("✅ Match result:", result); // true or false
  })
  .catch(error => {
    console.error("❌ Error comparing password:", error.message);
  });
