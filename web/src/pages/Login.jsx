import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email first to resend verification.');
      return;
    }
    try {
      setLoading(true);
      setMessage('Sending verification email...');
      
      // Set a 60-second timeout for the request
      await axios.post(`${API_URL}/auth/resend-verification`, { email }, { timeout: 60000 });
      
      setMessage('Verification email sent! Please check your inbox (and spam folder).');
      setError('');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your internet connection or try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to resend verification email.');
      }
      setMessage('');
      console.error('Resend verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Login to Kcal</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green', background: '#e8f5e9', padding: '10px', borderRadius: '4px' }}>{message}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      
      {error && error.includes('verify') && (
        <button 
          onClick={handleResendVerification}
          disabled={loading}
          style={{ 
            marginTop: '10px', 
            padding: '10px', 
            background: loading ? '#ccc' : '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            width: '100%', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      )}

      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
