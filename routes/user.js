// routes/user.js
import express from 'express';
import { protect } from '../controllers/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
} from '../controllers/user-controller.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// GET /api/users/me - Get current user's profile
router.get('/me', getUserProfile);

// PUT /api/users/me - Update current user's profile
router.put('/me', updateUserProfile);

// DELETE /api/users/me - Delete current user's account
router.delete('/me', deleteUserAccount);

export { router as userRoutes };