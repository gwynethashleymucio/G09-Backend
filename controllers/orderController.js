// controllers/orderController.js
import { Order } from '../models/Order.js';
import { StatusCodes } from 'http-status-codes';
import { NotFoundError } from '../errors/index.js';

export const createOrder = async (req, res) => {
    const { items, paymentMethod, specialInstructions } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const order = await Order.create({
        user: req.user.id,
        items,
        totalAmount,
        paymentMethod,
        specialInstructions
    });

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { order }
    });
};

// Add other order operations (getUserOrders, updateOrderStatus, cancelOrder)