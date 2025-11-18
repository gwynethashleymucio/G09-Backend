import express from 'express';
import { 
    createPayment, 
    getAllPayments, 
    getPayment, 
    updatePaymentStatus, 
    getMyPayments, 
    processGCashWebhook 
} from '../controllers/paymentController.js';
import { protect, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
router.post('/', createPayment);

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get logged in user's payments
 * @access  Private
 */
router.get('/my-payments', getMyPayments);

/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin only)
 * @access  Private/Admin
 */
router.get('/', isStaff, getAllPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment by ID
 * @access  Private
 */
router.get('/:id', getPayment);

/**
 * @route   PATCH /api/payments/:id/status
 * @desc    Update payment status (Admin only)
 * @access  Private/Admin
 */
router.patch('/:id/status', isStaff, updatePaymentStatus);

/**
 * @route   POST /api/payments/webhook/gcash
 * @desc    Process GCash payment webhook
 * @access  Public (GCash server)
 */
router.post('/webhook/gcash', processGCashWebhook);

export default router;
