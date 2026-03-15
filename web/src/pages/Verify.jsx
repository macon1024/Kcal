import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Verify = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/auth/verify', { token });
        setStatus(res.data.message);
      } catch (err) {
        setStatus(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    verifyAccount();
  }, [token]);

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <h2>Email Verification</h2>
      <p style={{ margin: '20px 0', fontSize: '1.2em' }}>{status}</p>
      <Link to="/login" style={{ display: 'inline-block', padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Go to Login
      </Link>
    </div>
  );
};

export default Verify;
