const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/analyze-food', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the backend environment variables.' });
    }

    // Use the Gemini 1.5 Flash model for fast image analysis
    // Try 'gemini-1.5-flash' or 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

    const prompt = `Analyze the image provided and identify any food or product seen. 
    Return the nutritional information in a structured JSON format with the following keys:
    - name: The name of the food or product.
    - calories: The estimated calories per 100g or per unit.
    - protein: The estimated protein in grams.
    - carbs: The estimated carbohydrates in grams.
    - fat: The estimated fat in grams.
    - servingSize: A common serving size (e.g., "1 unit", "100g", "1 cup").
    - baseAmount: 100
    - baseUnit: "g"
    
    If multiple items are seen, return the information for the most prominent one.
    Only return the JSON object, nothing else. Do not include markdown code blocks.`;

    console.log('Sending request to Gemini AI...');
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
    
    // Clean the AI response to get just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const nutritionData = JSON.parse(jsonMatch[0]);
        res.json(nutritionData);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        res.status(500).json({ error: 'Failed to parse AI response as valid JSON.' });
      }
    } else {
      res.status(500).json({ error: 'AI response did not contain nutritional data. Try a clearer photo.' });
    }

  } catch (error) {
    console.error('AI Analysis Error Details:', error);
    const errorMessage = error.message || 'Unknown error during AI analysis.';
    res.status(500).json({ error: `AI Error: ${errorMessage}` });
  }
});

module.exports = router;
