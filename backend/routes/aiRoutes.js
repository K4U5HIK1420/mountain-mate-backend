const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ✅ SAHI PATHS (Apne models folder mein check karo file ka asli naam kya hai)
const Hotel = require("../models/Hotel"); 
const Transport = require("../models/Transport"); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    // 1. Fetch data from DB
    const [hotels, rides] = await Promise.all([
      Hotel.find({}).select('hotelName location pricePerNight description').lean(),
      Transport.find({}).select('vehicleName from to price').lean()
    ]);

    const context = `
      DATABASE_INTEL:
      STAYS: ${JSON.stringify(hotels)}
      RIDES: ${JSON.stringify(rides)}
    `;

    // 2. Setup AI
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are 'M-Mate Neural Link', an elite Himalayan AI. Call user 'Pilot'. Use the database context to answer. If data is missing, give general mountain safety tips."
    });

    const result = await model.generateContent(`CONTEXT: ${context}\n\nUSER: ${prompt}`);
    const response = await result.response;
    
    res.json({ answer: response.text() });

  } catch (error) {
    console.error("AI_ERROR:", error.message);
    res.status(500).json({ answer: "UPLINK FAILURE. Check Backend Terminal, Pilot." });
  }
});

module.exports = router;