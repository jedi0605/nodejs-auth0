const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
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
app.post('/api/verify-auth0', (req, res) => {
    const { email, sub } = req.body;
    
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