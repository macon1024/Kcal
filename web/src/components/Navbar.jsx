import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '1rem', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0, padding: 0 }}>
        {user ? (
          <>
            <li><Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link></li>
            <li><Link to="/add-food" style={{ color: '#fff', textDecoration: 'none' }}>Add Food</Link></li>
          </>
        ) : (
          <li><Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Kcal App</Link></li>
        )}
      </ul>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Welcome, {user.username}</span>
          <button 
            onClick={handleLogout}
            style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
