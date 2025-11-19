import express from 'express';
import { processOrder, getOrderStatus, debugMenuItems } from '../controllers/chatbot-controller.js';
import { protect } from '../controllers/auth.js';

const router = express.Router();

// Process natural language order
router.post('/process-order', protect, processOrder);

// Get order status
router.get('/order-status/:orderNumber', protect, getOrderStatus);

// Debug endpoint to check menu items
router.get('/debug/menu-items', debugMenuItems);

export default router;
