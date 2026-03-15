const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Access your API key as an environment variable
let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  console.log('GoogleGenerativeAI initialized successfully.');
} catch (e) {
  console.error('Error initializing GoogleGenerativeAI:', e.message);
}

router.post('/analyze-food', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('ERROR: GEMINI_API_KEY is missing from .env');
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the backend environment variables.' });
    } else {
        console.log('GEMINI_API_KEY is present (length: ' + process.env.GEMINI_API_KEY.length + ')');
    }

    // Initialize the model with specific configuration if needed
    // Using gemini-1.5-flash for faster and cheaper analysis results
    // Use v1beta explicitly for flash models to avoid 404
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    }, { apiVersion: 'v1beta' });

    const prompt = `Identify the food or product in this image and return its nutritional information as a JSON object.
    
    The JSON object MUST have these exact keys:
    - name: string (The name of the food/product)
    - calories: number (Estimated calories per 100g or unit)
    - protein: number (Estimated protein in grams)
    - carbs: number (Estimated carbohydrates in grams)
    - fat: number (Estimated fat in grams)
    - servingSize: string (e.g., "100g", "1 unit")
    - baseAmount: 100
    - baseUnit: "g"

    If multiple items are present, identify the main one. Return ONLY the JSON object.`;

    console.log('Sending request to Gemini AI (gemini-1.5-flash)...');
    // The SDK expects the image data in a specific format
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('AI Response:', text);
    
    try {
      // With responseMimeType: "application/json", text should be a valid JSON string
      const nutritionData = JSON.parse(text);
      return res.json(nutritionData);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Fallback: try to find JSON in text if parsing fails
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const nutritionData = JSON.parse(jsonMatch[0]);
          return res.json(nutritionData);
        } catch (innerError) {
          return res.status(500).json({ error: 'Failed to parse AI response as valid JSON.' });
        }
      } else {
        return res.status(500).json({ error: 'AI response did not contain nutritional data. Try a clearer photo.' });
      }
    }

  } catch (error) {
    console.error('AI Analysis Error Details:', error);
    const errorMessage = error.message || 'Unknown error during AI analysis.';
    res.status(500).json({ error: `AI Error: ${errorMessage}` });
  }
});

module.exports = router;
