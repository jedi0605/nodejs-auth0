import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-auth', {
        withCredentials: true
      });
      setIsAuthenticated(response.data.authenticated);
      if (response.data.user) {
        setUserEmail(response.data.user.email);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', 
        { email, password },
        { withCredentials: true }
      );
      setIsAuthenticated(true);
      setUserEmail(email);
      setError('');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        withCredentials: true
      });
      setIsAuthenticated(false);
      setUserEmail('');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="App">
        <h1>Welcome!</h1>
        <p>You are logged in as: <strong>{userEmail}</strong></p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default App; 