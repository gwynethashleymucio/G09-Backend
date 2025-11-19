import { StatusCodes } from 'http-status-codes';

// Custom error classes
export class CustomAPIError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends CustomAPIError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

export class UnauthorizedError extends CustomAPIError {
    constructor(message = 'Not authorized to access this route') {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

export class ForbiddenError extends CustomAPIError {
    constructor(message = 'Forbidden') {
        super(message);
        this.statusCode = StatusCodes.FORBIDDEN;
    }
}

export class NotFoundError extends CustomAPIError {
    constructor(resource) {
        super(`${resource || 'Resource'} not found`);
        this.statusCode = StatusCodes.NOT_FOUND;
    }
}

export class ValidationError extends CustomAPIError {
    constructor(errors) {
        super('Validation failed');
        this.statusCode = StatusCodes.BAD_REQUEST;
        this.errors = errors;
    }
}

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
    // Default error response
    const errorResponse = {
        success: false,
        error: {
            name: err.name,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    };

    // Handle validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        errorResponse.error = {
            name: 'ValidationError',
            message: 'Validation failed',
            errors
        };
        return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        errorResponse.error = {
            name: 'AuthenticationError',
            message: 'Invalid token',
            details: 'The authentication token is invalid or malformed.'
        };
        return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse.error = {
            name: 'AuthenticationError',
            message: 'Token expired',
            details: 'Your session has expired. Please log in again.'
        };
        return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        errorResponse.error = {
            name: 'DuplicateFieldError',
            message: `${field} already exists`,
            field,
            value: err.keyValue[field]
        };
        return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }

    // Handle custom errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                name: err.name,
                message: err.message,
                ...(err.errors && { errors: err.errors }),
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    }

    // Log unexpected errors
    console.error('Unexpected Error:', err);

    // Send generic error response for unhandled errors
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
            name: 'InternalServerError',
            message: 'Something went wrong',
            ...(process.env.NODE_ENV === 'development' && { 
                details: err.message,
                stack: err.stack 
            })
        }
    });
};

// 404 Not Found middleware
export const notFound = (req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
            name: 'NotFoundError',
            message: `Cannot ${req.method} ${req.originalUrl}`,
            details: 'The requested resource was not found on this server.'
        }
    });
};
