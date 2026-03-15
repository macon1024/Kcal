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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    Only return the JSON object, nothing else.`;

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
    
    // Clean the AI response to get just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const nutritionData = JSON.parse(jsonMatch[0]);
      res.json(nutritionData);
    } else {
      res.status(500).json({ error: 'Failed to parse nutrition data from AI response' });
    }

  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze food image with AI' });
  }
});

module.exports = router;
