import express from 'express';
import { processOrder, getOrderStatus } from '../controllers/chatbotController.js';
import { protect } from '../controllers/auth.js';

const router = express.Router();

// Process natural language order
router.post('/process-order', protect, processOrder);

// Get order status
router.get('/order-status/:orderNumber', protect, getOrderStatus);

export default router;
