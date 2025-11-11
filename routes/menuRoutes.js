import express from 'express';
import {
    getAllMenuItems,
    createMenuItem
} from '../controllers/menuController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/', getAllMenuItems);

// Protected routes (admin only)
router.use(protect, restrictTo('canteen_staff'));
router.post('/', createMenuItem);

export { router as menuRoutes };