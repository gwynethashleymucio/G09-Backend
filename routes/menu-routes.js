import express from 'express';
import {
    getAllMenuItems,
    createMenuItem
} from '../controllers/menu-controller.js';
import { protect, restrictTo } from '../middleware/auth-middleware.js';

const router = express.Router();

// Public route
router.get('/', getAllMenuItems);

// Protected routes (admin only)
router.use(protect, restrictTo('canteen_staff'));
router.post('/', createMenuItem);

export { router as menuRoutes };