// routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post(
    '/register',
    [
        body('firstName').notEmpty().trim().withMessage('First name is required'),
        body('lastName').notEmpty().trim().withMessage('Last name is required'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email')
            .custom((email) => email.endsWith('@sdca.edu.ph'))
            .withMessage('Email must be an sdca.edu.ph address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('userType')
            .isIn(['student', 'faculty', 'canteen_staff'])
            .withMessage('Invalid user type')
    ],
    register
);

// POST /api/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').exists().withMessage('Password is required')
    ],
    login
);

export default router;