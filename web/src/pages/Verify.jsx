import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Verify = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying...');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const verifyAccount = async () => {
      if (!token) {
        setStatus('Invalid link: No token provided.');
        return;
      }
      
      try {
        console.log(`Verifying token: ${token} at ${API_URL}/auth/verify`);
        const res = await axios.post(`${API_URL}/auth/verify`, { token });
        setStatus(res.data.message);
      } catch (err) {
        console.error('Verification error:', err);
        if (err.response && err.response.status === 404) {
             setStatus('404 Not Found: Could not connect to verification server. Please check VITE_API_URL.');
        } else {
             setStatus(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
        }
      }
    };
    verifyAccount();
  }, [token]);

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <h2>Email Verification</h2>
      <p style={{ margin: '20px 0', fontSize: '1.2em', color: status.includes('failed') || status.includes('Invalid') || status.includes('404') ? 'red' : 'green' }}>{status}</p>
      {status.includes('404') && (
        <p style={{fontSize: '0.8em', color: '#666'}}>
           Debug Info: API_URL is "{API_URL}"
        </p>
      )}
      <Link to="/login" style={{ display: 'inline-block', padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Go to Login
      </Link>
    </div>
  );
};

export default Verify;
