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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Daily Summary ({today})</h2>
        <Link to="/add-food" style={{ 
          background: '#007bff', 
          color: 'white', 
          padding: '8px 16px', 
          textDecoration: 'none', 
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          + Add New
        </Link>
      </div>

      <div style={{ background: '#f4f4f4', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Calories Consumed: {Math.round(totalCalories)} kcal</h3>
        {/* Add macro breakdown here */}
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Meals</h3>
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
                padding: '10px',
                borderBottom: '1px solid #eee',
                background: '#fff'
              }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{meal.foodId?.name || 'Unknown Food'}</strong>
                  <div style={{ color: '#666', marginTop: '2px', fontSize: '0.9rem' }}>
                    {meal.quantity}{meal.unit || meal.foodId?.baseUnit || 'g'} - {meal.mealType}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <strong style={{ color: '#2e78b7', fontSize: '1rem' }}>{mealCalories} kcal</strong>
                  <button 
                    onClick={() => handleDeleteMeal(meal.id)}
                    style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
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
