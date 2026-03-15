const Food = require('./models/Food');

const seedFoods = [
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: '1 medium (100g)', baseAmount: 100, baseUnit: 'g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: '1 medium (100g)', baseAmount: 100, baseUnit: 'g' },
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g', baseAmount: 100, baseUnit: 'g' },
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: '1 cup (91g)', baseAmount: 91, baseUnit: 'g' },
  { name: 'Rice (White, Cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: '100g', baseAmount: 100, baseUnit: 'g' },
  { name: 'Egg (Large)', calories: 78, protein: 6, carbs: 0.6, fat: 5, servingSize: '1 large (50g)', baseAmount: 50, baseUnit: 'g' },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g', baseAmount: 100, baseUnit: 'g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '100g', baseAmount: 100, baseUnit: 'g' },
  // Drinks
  { name: 'Coca Cola', calories: 140, protein: 0, carbs: 39, fat: 0, servingSize: '1 can (330ml)', baseAmount: 330, baseUnit: 'ml' },
  { name: 'Orange Juice', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, servingSize: '1 cup (240ml)', baseAmount: 240, baseUnit: 'ml' },
  { name: 'Milk (Whole)', calories: 150, protein: 8, carbs: 12, fat: 8, servingSize: '1 cup (240ml)', baseAmount: 240, baseUnit: 'ml' },
  { name: 'Coffee (Black)', calories: 2, protein: 0.3, carbs: 0, fat: 0, servingSize: '1 cup (240ml)', baseAmount: 240, baseUnit: 'ml' },
  { name: 'Green Tea', calories: 2, protein: 0, carbs: 0, fat: 0, servingSize: '1 cup (240ml)', baseAmount: 240, baseUnit: 'ml' },
  { name: 'Beer (Regular)', calories: 153, protein: 1.6, carbs: 13, fat: 0, servingSize: '1 can (355ml)', baseAmount: 355, baseUnit: 'ml' },
];

const seedDB = async () => {
  try {
    // NeDB uses remove({}, { multi: true }) to delete all documents
    await Food.remove({}, { multi: true });
    await Food.insert(seedFoods);
    console.log('Database seeded successfully');
  } catch (err) {
    console.log(err);
  }
};

seedDB();
