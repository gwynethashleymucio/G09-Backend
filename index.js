// index.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';
import authRoutes from './routes/auth.js';
import { userRoutes } from './routes/user.js';

console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not found');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Test route - moved before other route handlers
app.get('', (req, res) => {
    console.log('Test route hit!');
    res.json({ message: "API is working!" });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Not Found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});