// controllers/auth.js
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { StatusCodes } from 'http-status-codes';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, userType } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Email already in use'
            });
        }

        // Create new user
        const newUser = await UserModel.create({
            firstName,
            lastName,
            email,
            password,
            userType
        });

        // Generate JWT token
        const token = signToken(newUser._id);

        // Remove password from output
        newUser.password = undefined;

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        // 2) Check if user exists && password is correct
        const user = await UserModel.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'Incorrect email or password'
            });
        }

        // 3) If everything ok, send token to client
        const token = signToken(user._id);

        // Remove password from output
        user.password = undefined;

        res.status(StatusCodes.OK).json({
            status: 'success',
            token,
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
    try {
        let token;

        // 1) Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await UserModel.findById(decoded.id);
        if (!currentUser) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();
    } catch (err) {
        next(err);
    }
};