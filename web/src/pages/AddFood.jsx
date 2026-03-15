import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import Tesseract from 'tesseract.js';
import { AuthContext } from '../context/AuthContext';

const AddFood = () => {
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState('breakfast');
  const [newFood, setNewFood] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: '100g', baseAmount: 100, baseUnit: 'g' });
  const [loadingAutoFill, setLoadingAutoFill] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const aiInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      setShowScanner(true);
      
      // Use setTimeout to ensure the video element is rendered before setting srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
          };
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowScanner(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64String = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    setLoadingAutoFill(true);
    stopCamera();

    try {
      console.log('Sending capture to AI...');
      const res = await axios.post(`${API_URL}/ai/analyze-food`, {
        imageBase64: base64String
      });

      if (res.data) {
        const product = res.data;
        setNewFood({
          ...newFood,
          name: product.name || newFood.name,
          calories: Math.round(product.calories || 0),
          protein: Math.round(product.protein || 0),
          carbs: Math.round(product.carbs || 0),
          fat: Math.round(product.fat || 0),
          servingSize: product.servingSize || '100g',
          baseAmount: 100,
          baseUnit: 'g'
        });
        alert(`AI Identified: ${product.name}`);
      }
    } catch (apiErr) {
      console.error('AI API Error:', apiErr);
      const errorMsg = apiErr.response?.data?.error || 'Failed to analyze with AI.';
      alert(errorMsg);
    } finally {
      setLoadingAutoFill(false);
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

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      console.log('OCR Result:', text);

      // More robust value finding: look for the keyword and then the next number
      const findValue = (keywords) => {
        // Remove spaces and make lowercase for better matching
        const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
        
        for (const keyword of keywords) {
          const lowerKey = keyword.toLowerCase();
          const index = normalizedText.indexOf(lowerKey);
          
          if (index !== -1) {
            // Look at text after the keyword (up to 30 characters)
            const afterText = normalizedText.substring(index + lowerKey.length, index + lowerKey.length + 30);
            // Match the first number (integer or decimal)
            const match = afterText.match(/(\d+\.?\d*)/);
            if (match) {
              const val = parseFloat(match[1]);
              // Basic sanity check: if calories, usually > 0; if macros, usually < 100g per 100g
              if (!isNaN(val)) return Math.round(val);
            }
          }
        }
        return null;
      };

      const calories = findValue(['calories', 'kcal', 'energy', 'valor energético', 'calorias']);
      const protein = findValue(['protein', 'proteínas', 'proteina']);
      const carbs = findValue(['carbs', 'carbohydrate', 'carbohidratos', 'hidratos de carbono']);
      const fat = findValue(['fat', 'total fat', 'grasas', 'gordura']);

      // Find potential name
      const findName = () => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
        if (lines.length > 0) return lines[0];
        return null;
      };
      const detectedName = findName();

      setNewFood(prev => ({
        ...prev,
        name: detectedName || prev.name,
        calories: calories !== null ? calories : prev.calories,
        protein: protein !== null ? protein : prev.protein,
        carbs: carbs !== null ? carbs : prev.carbs,
        fat: fat !== null ? fat : prev.fat,
      }));

      alert('OCR Scan Complete! Form updated with detected nutrition values.');
    } catch (err) {
      console.error('OCR Error:', err);
      alert('Failed to process image. Please try a clearer photo.');
    } finally {
      setOcrLoading(false);
      // Clear input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleAISearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingAutoFill(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        try {
          const res = await axios.post(`${API_URL}/ai/analyze-food`, {
            imageBase64: base64String
          });

          if (res.data) {
            const product = res.data;
            setNewFood({
              ...newFood,
              name: product.name || newFood.name,
              calories: Math.round(product.calories || 0),
              protein: Math.round(product.protein || 0),
              carbs: Math.round(product.carbs || 0),
              fat: Math.round(product.fat || 0),
              servingSize: product.servingSize || '100g',
              baseAmount: 100,
              baseUnit: 'g'
            });
            alert(`AI Identified: ${product.name}`);
          }
        } catch (apiErr) {
          console.error('AI API Error:', apiErr);
          const errorMsg = apiErr.response?.data?.error || 'Failed to analyze with AI.';
          alert(errorMsg);
        } finally {
          setLoadingAutoFill(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('AI Search Error:', err);
      alert('Failed to process image for AI search.');
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
              <button type="button" onClick={startCamera} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Camera AI
              </button>
              <button 
                type="button" 
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(newFood.name || 'food product')}&tbm=isch`, '_blank')} 
                style={{ padding: '8px 16px', background: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Visual Search
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                style={{ padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                disabled={ocrLoading}
              >
                {ocrLoading ? 'Reading...' : 'Scan Labels (OCR)'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleOCR} 
              />
              <button 
                type="button" 
                onClick={() => aiInputRef.current.click()} 
                style={{ padding: '8px 16px', background: '#FFD700', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                disabled={loadingAutoFill}
              >
                {loadingAutoFill ? 'Thinking...' : 'AI Search (File)'}
              </button>
              <input 
                type="file" 
                ref={aiInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleAISearch} 
              />
            </div>
          </div>

          {showScanner && (
            <div style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' 
            }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '90%', width: '500px' }}>
                <h3 style={{ marginTop: 0 }}>Camera AI Search</h3>
                <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', background: '#000', marginBottom: '15px', overflow: 'hidden', borderRadius: '4px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={captureImage} style={{ flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Capture & Identify
                  </button>
                  <button type="button" onClick={stopCamera} style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
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
