import express from 'express';
import {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrderHistory
} from '../controllers/order-controller.js';
import { protect, isStaff, isStaffOrFaculty } from '../middleware/auth-middleware.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Staff-only routes
router.route('/')
    .get(isStaff, getAllOrders);

// User order routes
router.route('/my-orders')
    .get(getMyOrders);

// Order status management
router.route('/:id/status')
    .patch(isStaff, updateOrderStatus);

// Order history
router.route('/:id/history')
    .get(getOrderHistory);

// Single order operations
router.route('/:id')
    .get(isStaff, getOrderById)
    .delete(cancelOrder);

// Create new order (available to students and faculty)
router.route('/')
    .post(createOrder);

export { router as orderRoutes };