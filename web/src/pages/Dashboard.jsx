import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const userId = user?.id; // Use logged in user ID
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchLogs();
  }, [userId, today]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs/${userId}/${today}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      setLogs(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!logs || !logs._id || !mealId) {
      alert("This meal doesn't have an ID (it might have been created before the ID system was added). Please add a new meal.");
      return;
    }
    try {
      await axios.delete(`${API_URL}/logs/${logs._id}/meal/${mealId}`);
      // Refresh logs after deletion
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete meal', err);
      alert('Failed to delete meal');
    }
  };

  if (loading) return <div>Loading...</div>;

  const totalCalories = logs?.meals.reduce((acc, meal) => {
    if (!meal.foodId) return acc;
    const baseAmount = meal.foodId.baseAmount || 1;
    const ratio = meal.quantity / baseAmount;
    return acc + (meal.foodId.calories * ratio);
  }, 0) || 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Daily Summary ({today})</h1>
        <Link to="/add-food" style={{ 
          background: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none', 
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          + Add New
        </Link>
      </div>

      <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Calories Consumed: {Math.round(totalCalories)} kcal</h2>
        {/* Add macro breakdown here */}
      </div>

      <h3 style={{ marginTop: '30px' }}>Meals</h3>
      {logs?.meals.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {logs.meals.map((meal, index) => {
            const baseAmount = meal.foodId?.baseAmount || 1;
            const ratio = meal.quantity / baseAmount;
            const mealCalories = Math.round((meal.foodId?.calories || 0) * ratio);

            return (
              <li key={meal.id || index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '15px',
                borderBottom: '1px solid #eee',
                background: '#fff'
              }}>
                <div>
                  <strong style={{ fontSize: '1.1em' }}>{meal.foodId?.name || 'Unknown Food'}</strong>
                  <div style={{ color: '#666', marginTop: '5px' }}>
                    {meal.quantity}{meal.unit || meal.foodId?.baseUnit || 'g'} - {meal.mealType}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <strong style={{ color: '#2e78b7', fontSize: '1.2em' }}>{mealCalories} kcal</strong>
                  <button 
                    onClick={() => handleDeleteMeal(meal.id)}
                    style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '5px 10px', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      opacity: meal.id ? 1 : 0.5
                    }}
                    title={meal.id ? "Delete Meal" : "Cannot delete old meals"}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ fontStyle: 'italic', color: '#666' }}>No meals logged today.</p>
      )}
    </div>
  );
};

export default Dashboard;
