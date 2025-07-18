const path = require('path');
const dotenv = require('dotenv');

// Log the current directory and .env file path
console.log('Current directory:', process.cwd());
console.log('Looking for .env file at:', path.join(process.cwd(), '.env'));

// Load environment variables from the current directory
const result = dotenv.config({ path: path.join(process.cwd(), '.env') });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');

// Debug logging for environment variables
console.log('\nEnvironment variables loaded:');
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
console.log('AUTH0_ISSUER_BASE_URL:', process.env.AUTH0_ISSUER_BASE_URL);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);

const app = express();
const PORT = 5000;

// Auth0 configuration
const checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if using https
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Hardcoded user data with roles
const users = [
    {
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        internal: true
    },
    {
        email: 'user@example.com',
        password: 'user123',
        role: 'user',
        internal: true
    },
    {
        email: 'user2@example.com',
        password: 'user123',
        role: 'user',
        internal: true
    }
];

// Traditional login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.internal);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (password !== user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Store user info in session including role
    req.session.user = { 
        email: user.email,
        role: user.role,
        isInternal: true
    };
    
    res.json({ 
        message: 'Logged in successfully',
        role: user.role
    });
});

// Auth0 verification endpoint
app.post('/api/verify-auth0', checkJwt, (req, res) => {
    const { email, sub } = req.body;
    
    // Log the token payload to see its structure
    console.log('Auth0 Token Payload:', req.auth.payload);
    
    // The email might be in a different field, let's check sub instead
    if (req.auth.payload.sub !== sub) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user exists in our system
    let user = users.find(u => u.email === email);
    
    // If user doesn't exist, create a new external user
    if (!user) {
        user = {
            email: email,
            role: 'auth0user',
            internal: false
        };
        users.push(user);
    }

    // Store user info in session including role
    req.session.user = { 
        email: user.email,
        role: user.role,
        auth0Sub: sub,
        isInternal: false
    };
    
    res.json({ 
        message: 'Verified successfully',
        role: user.role
    });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: {
                email: req.session.user.email,
                role: req.session.user.role,
                isInternal: req.session.user.isInternal
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 