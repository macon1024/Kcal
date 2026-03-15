import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { AuthContext } from '../context/AuthContext';

const AddFood = () => {
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState('breakfast');
  const [newFood, setNewFood] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: '100g', baseAmount: 100, baseUnit: 'g' });
  const [loadingAutoFill, setLoadingAutoFill] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { user } = useContext(AuthContext);
  const userId = user?.id; // Use logged in user ID
  const today = new Date().toISOString().split('T')[0];
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${API_URL}/foods`);
      setFoods(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async (err, result) => {
    if (result) {
      setShowScanner(false);
      const barcode = result.text;
      setLoadingAutoFill(true);
      alert(`Scanned Barcode: ${barcode}`);
      
      try {
        const res = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        
        if (res.data.status === 1) {
          const product = res.data.product;
          const nutriments = product.nutriments || {};
          setNewFood({
            ...newFood,
            name: product.product_name || newFood.name,
            calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0),
            protein: Math.round(nutriments.proteins_100g || nutriments.proteins_serving || nutriments.proteins || 0),
            carbs: Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates_serving || nutriments.carbohydrates || 0),
            fat: Math.round(nutriments.fat_100g || nutriments.fat_serving || nutriments.fat || 0),
            servingSize: product.serving_size || '100g',
            baseAmount: 100,
            baseUnit: 'g'
          });
          alert('Found and filled nutrition data!');
        } else {
          const searchUrl = `https://www.google.com/search?q=barcode+${barcode}+food+nutrition`;
          if (window.confirm('Product not found in OpenFoodFacts database. Would you like to search the internet for it?')) {
            window.open(searchUrl, '_blank');
          }
        }
      } catch (apiErr) {
        console.error(apiErr);
        const searchUrl = `https://www.google.com/search?q=barcode+${barcode}+food+nutrition`;
        if (window.confirm('Failed to fetch product data. Would you like to search the internet for it?')) {
          window.open(searchUrl, '_blank');
        }
      } finally {
        setLoadingAutoFill(false);
      }
    }
  };

  const handleAutoFill = async () => {
    if (!newFood.name) return alert('Please enter a food name first');
    setLoadingAutoFill(true);
    try {
      // Use https and ensure proper encoding
      const encodedSearch = encodeURIComponent(newFood.name);
      const res = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedSearch}&search_simple=1&action=process&json=1`);
      
      if (res.data.products && res.data.products.length > 0) {
        const product = res.data.products[0];
        const nutriments = product.nutriments || {};
        setNewFood({
          ...newFood,
          name: product.product_name || newFood.name,
          calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0),
          protein: Math.round(nutriments.proteins_100g || nutriments.proteins_serving || nutriments.proteins || 0),
          carbs: Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates_serving || nutriments.carbohydrates || 0),
          fat: Math.round(nutriments.fat_100g || nutriments.fat_serving || nutriments.fat || 0),
          servingSize: product.serving_size || '100g',
          baseAmount: 100,
          baseUnit: 'g'
        });
        alert('Found and filled nutrition data!');
      } else {
        alert('No data found for this food.');
      }
    } catch (err) {
      console.error('OpenFoodFacts API Error:', err);
      alert('Failed to fetch data from OpenFoodFacts. The service might be temporarily down or blocked.');
    } finally {
      setLoadingAutoFill(false);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/foods`, newFood);
      setFoods([...foods, res.data]);
      setNewFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: '100g', baseAmount: 100, baseUnit: 'g' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogMeal = async () => {
    if (!selectedFood) return;

    try {
      await axios.post(`${API_URL}/logs`, {
        userId,
        date: today,
        meals: [{ 
          foodId: selectedFood, 
          quantity, 
          unit: foods.find(f => f._id === selectedFood)?.baseUnit || 'g',
          mealType 
        }]
      });
      alert('Meal logged!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Add Food</h1>
      
      <div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h2>Create New Food</h2>
        <form onSubmit={handleAddFood} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Food Name</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={{ flex: 1, padding: '8px' }} placeholder="e.g. Avocado" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} required />
              <button type="button" onClick={handleAutoFill} disabled={loadingAutoFill} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                {loadingAutoFill ? 'Searching...' : 'Auto-fill'}
              </button>
              <button type="button" onClick={() => setShowScanner(true)} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Scan
              </button>
              <button 
                type="button" 
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(newFood.name || 'food product')}&tbm=isch`, '_blank')} 
                style={{ padding: '8px 16px', background: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Visual Search
              </button>
            </div>
          </div>

          {showScanner && (
            <div style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' 
            }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '90%', width: '400px' }}>
                <h3 style={{ marginTop: 0 }}>Scan Barcode</h3>
                <div style={{ width: '100%', height: '300px', background: '#000', marginBottom: '15px' }}>
                  <BarcodeScannerComponent
                    width={300}
                    height={300}
                    onUpdate={handleScan}
                  />
                </div>
                <button type="button" onClick={() => setShowScanner(false)} style={{ width: '100%', padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Calories (per base amount)</label>
            <input style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} type="number" placeholder="e.g. 160" value={newFood.calories} onChange={e => setNewFood({...newFood, calories: Number(e.target.value)})} required />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Protein (g)</label>
              <input style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} type="number" placeholder="e.g. 2" value={newFood.protein} onChange={e => setNewFood({...newFood, protein: Number(e.target.value)})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Carbs (g)</label>
              <input style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} type="number" placeholder="e.g. 9" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: Number(e.target.value)})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fat (g)</label>
              <input style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} type="number" placeholder="e.g. 15" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: Number(e.target.value)})} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Serving Configuration</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={{ flex: 2, padding: '8px' }} placeholder="Serving Display (e.g., 1 cup (240ml))" value={newFood.servingSize} onChange={e => setNewFood({...newFood, servingSize: e.target.value})} required />
              <input style={{ flex: 1, padding: '8px' }} type="number" placeholder="Base Amount (e.g. 100)" value={newFood.baseAmount} onChange={e => setNewFood({...newFood, baseAmount: Number(e.target.value)})} required />
              <select style={{ padding: '8px' }} value={newFood.baseUnit} onChange={e => setNewFood({...newFood, baseUnit: e.target.value})}>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="unit">unit</option>
              </select>
            </div>
          </div>

          <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
            Create Food
          </button>
        </form>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h2>Log Meal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Food</label>
            <select style={{ width: '100%', padding: '8px' }} value={selectedFood} onChange={e => setSelectedFood(e.target.value)}>
              <option value="">-- Choose a food --</option>
              {foods.map(food => (
                <option key={food._id} value={food._id}>{food.name} ({food.calories} kcal / {food.baseAmount}{food.baseUnit})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  style={{ flex: 1, padding: '8px' }}
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(Number(e.target.value))} 
                  min="1" 
                  placeholder={`Amount`}
                />
                <span>{foods.find(f => f._id === selectedFood)?.baseUnit || ''}</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Meal Type</label>
              <select style={{ width: '100%', padding: '8px' }} value={mealType} onChange={e => setMealType(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <button onClick={handleLogMeal} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Log Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFood;
