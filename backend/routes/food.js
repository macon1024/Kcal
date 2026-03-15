const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// GET all foods
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find({});
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET food by ID
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id });
    if (!food) return res.status(404).json({ message: 'Food not found' });
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE food
router.post('/', async (req, res) => {
  const foodData = {
    name: req.body.name,
    calories: req.body.calories, // base calories per base unit
    protein: req.body.protein,
    carbs: req.body.carbs,
    fat: req.body.fat,
    servingSize: req.body.servingSize || '100g', // Display string (e.g., "1 cup (240ml)")
    baseAmount: req.body.baseAmount || 100,      // Numeric base (e.g., 100, 240)
    baseUnit: req.body.baseUnit || 'g'           // Unit string (e.g., 'g', 'ml', 'unit')
  };

  try {
    const newFood = await Food.insert(foodData);
    res.status(201).json(newFood);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE food
router.patch('/:id', async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id });
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const updates = { ...food };
    if (req.body.name) updates.name = req.body.name;
    if (req.body.calories) updates.calories = req.body.calories;
    if (req.body.protein) updates.protein = req.body.protein;
    if (req.body.carbs) updates.carbs = req.body.carbs;
    if (req.body.fat) updates.fat = req.body.fat;
    if (req.body.servingSize) updates.servingSize = req.body.servingSize;
    if (req.body.baseAmount) updates.baseAmount = req.body.baseAmount;
    if (req.body.baseUnit) updates.baseUnit = req.body.baseUnit;

    await Food.update({ _id: req.params.id }, updates);
    const updatedFood = await Food.findOne({ _id: req.params.id });
    res.json(updatedFood);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE food
router.delete('/:id', async (req, res) => {
  try {
    const numRemoved = await Food.remove({ _id: req.params.id }, {});
    if (numRemoved === 0) return res.status(404).json({ message: 'Food not found' });
    res.json({ message: 'Food deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
