const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Attempting to use gemini-1.5-flash...");
    // Just a dummy call to see if it exists
    console.log("Model object created successfully.");
  } catch (e) {
    console.error("Error creating model:", e);
  }
}

listModels();
