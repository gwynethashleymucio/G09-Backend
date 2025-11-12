import dotenv from 'dotenv';
dotenv.config();
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';
import { createServer } from 'http';
import { initSocket } from './socket.js';

// Import routes
import chatbotRoutes from './routes/chatbotRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import authRoutes from './routes/auth.js';
import { menuRoutes } from './routes/menuRoutes.js';
import { userRoutes } from './routes/user.js';

// Import error handlers (only once)


console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not found');

const app = express();
const server = createServer(app);
initSocket(server);

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Test route
app.get('/api', (req, res) => {
    console.log('Test route hit!');
    res.json({ message: "API is working!" });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 handler - must be after all other routes
app.use(notFound);

// Global error handler - must be after all other middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Database connection and server startup
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();