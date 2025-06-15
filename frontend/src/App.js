import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';

function App() {
  const { isAuthenticated: isAuth0Authenticated, user: auth0User, loginWithRedirect, logout: auth0Logout, getAccessTokenSilently } = useAuth0();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('traditional'); // 'traditional' or 'auth0'

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuth0Authenticated && auth0User) {
      verifyAuth0WithBackend();
    }
  }, [isAuth0Authenticated, auth0User]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-auth', {
        withCredentials: true
      });
      setIsAuthenticated(response.data.authenticated);
      if (response.data.user) {
        setUserEmail(response.data.user.email);
        setUserRole(response.data.user.role);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  };

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', 
        { email, password },
        { withCredentials: true }
      );
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserRole(response.data.role);
      setError('');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const verifyAuth0WithBackend = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post('http://localhost:5000/api/verify-auth0', {
        email: auth0User.email,
        sub: auth0User.sub
      }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setIsAuthenticated(true);
      setUserEmail(auth0User.email);
      setUserRole(response.data.role);
      setError('');
    } catch (err) {
      console.error('Backend verification failed:', err);
      setError('Failed to verify with backend');
      auth0Logout({ returnTo: window.location.origin });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        withCredentials: true
      });
      setIsAuthenticated(false);
      setUserEmail('');
      setUserRole('');
      if (isAuth0Authenticated) {
        auth0Logout({ returnTo: window.location.origin });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="App">
        <h1>Welcome!</h1>
        <p>You are logged in as: <strong>{userEmail}</strong></p>
        <p>Role: <strong>{userRole}</strong></p>
        {userRole === 'admin' && (
          <div className="admin-section">
            <h2>Admin Dashboard</h2>
            <p>This content is only visible to administrators.</p>
            {/* Add admin-specific features here */}
          </div>
        )}
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Login</h1>
      <div className="login-method-selector">
        <button 
          className={loginMethod === 'traditional' ? 'active' : ''} 
          onClick={() => setLoginMethod('traditional')}
        >
          Internal Login
        </button>
        <button 
          className={loginMethod === 'auth0' ? 'active' : ''} 
          onClick={() => setLoginMethod('auth0')}
        >
          External Login
        </button>
      </div>

      {loginMethod === 'traditional' ? (
        <form onSubmit={handleTraditionalLogin}>
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
      ) : (
        <div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={() => loginWithRedirect()}>Login with Auth0</button>
        </div>
      )}
    </div>
  );
}

export default App; 