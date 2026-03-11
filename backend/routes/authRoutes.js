const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/authController");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

module.exports = router;

console.log("Auth Routes Loaded");
router.get("/test", (req,res)=>{
  res.send("Auth route working");
});