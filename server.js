require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://127.0.0.1:5501',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Auth routes - Make sure this comes before static file serving
app.use('/api/auth', authRoutes);

// Serve index.html and auth.html
app.get(['/', '/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/auth', '/auth.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Handle preflight requests
app.options('*', cors());

// Handle 404
app.use((req, res, next) => {
    console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, 'auth.html'));
    } else {
        res.status(404).json({ message: 'Route not found' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5501;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server started at http://localhost:${PORT}`);
});