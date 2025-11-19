import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { UserModel } from '../models/User.js';

// Error class for authentication errors
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
        this.name = 'AuthenticationError';
    }
}

// Error class for authorization errors
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.FORBIDDEN;
        this.name = 'AuthorizationError';
    }
}

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.jwt) {
            // Or get token from cookies
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new AuthenticationError('You are not logged in! Please log in to get access.');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await UserModel.findById(decoded.id);
        if (!currentUser) {
            throw new AuthenticationError('The user belonging to this token no longer exists.');
        }

        // Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            throw new AuthenticationError('User recently changed password! Please log in again.');
        }

        // Grant access to protected route
        req.user = currentUser;
        res.locals.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};

// Role-based authorization middleware
const restrictTo = (...roles) => {
    return (req, res, next) => {
        try {
            if (!roles.includes(req.user.userType)) {
                throw new AuthorizationError('You do not have permission to perform this action');
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Specific role middlewares
const isStudent = restrictTo('student');
const isFaculty = restrictTo('faculty');
const isStaff = restrictTo('canteen_staff');
const isStaffOrFaculty = restrictTo('canteen_staff', 'faculty');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
        status: 'error',
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Not found middleware
const notFound = (req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`
    });
};

// Export all middleware functions
export {
    protect,
    restrictTo,
    isStudent,
    isFaculty,
    isStaff,
    isStaffOrFaculty,
    errorHandler,
    notFound
};
