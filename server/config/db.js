const mongoose = require('mongoose');
const { log } = require('console');
mongoose.connect("mongodb://localhost:27017/SnapTalk")
.then(()=>{
  console.log("connected");
  
})
.catch((error)=>{
  console.log(error);
})
