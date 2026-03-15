const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const Food = require('../models/Food');

// GET daily log
router.get('/:userId/:date', async (req, res) => {
  try {
    const log = await Log.findOne({ userId: req.params.userId, date: new Date(req.params.date).toISOString() });
    
    // Manual Populate since NeDB doesn't support populate
    if (log && log.meals) {
      const populatedMeals = await Promise.all(log.meals.map(async (meal) => {
        const food = await Food.findOne({ _id: meal.foodId });
        return { ...meal, foodId: food };
      }));
      log.meals = populatedMeals;
    }

    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE or UPDATE daily log
router.post('/', async (req, res) => {
  const { userId, date, meals } = req.body;
  const dateISO = new Date(date).toISOString();

  // meals should be array of: { foodId, quantity, unit, mealType }
  // Note: we assign IDs below.

  try {
    let log = await Log.findOne({ userId, date: dateISO });

    // Create new meals with IDs if they don't have them
    const mealsToAdd = meals.map(m => ({
      ...m,
      id: m.id || Math.random().toString(36).substr(2, 9)
    }));

    if (log) {
      // Update existing log
      await Log.update(
        { _id: log._id },
        { $push: { meals: { $each: mealsToAdd } } }
      );
      const updatedLog = await Log.findOne({ _id: log._id });
      res.json(updatedLog);
    } else {
      // Create new log
      const newLog = await Log.insert({
        userId,
        date: dateISO,
        meals: mealsToAdd
      });
      res.status(201).json(newLog);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE specific meal from a log
router.delete('/:logId/meal/:mealId', async (req, res) => {
  try {
    const logId = req.params.logId;
    const mealId = req.params.mealId;

    const log = await Log.findOne({ _id: logId });
    if (!log) return res.status(404).json({ message: 'Log not found' });

    // Filter out the meal with the given ID
    const updatedMeals = log.meals.filter(m => String(m.id) !== String(mealId));

    await Log.update(
      { _id: logId },
      { $set: { meals: updatedMeals } }
    );

    res.json({ message: 'Meal deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE daily log
router.delete('/:id', async (req, res) => {
  try {
    const numRemoved = await Log.remove({ _id: req.params.id }, {});
    if (numRemoved === 0) return res.status(404).json({ message: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
