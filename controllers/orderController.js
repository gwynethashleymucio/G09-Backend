import { StatusCodes } from 'http-status-codes';
import { Order as OrderModel } from '../models/Order.js';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../middleware/errorMiddleware.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Student, Faculty)
export const createOrder = async (req, res, next) => {
    try {
        const { items, paymentMethod, specialInstructions } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new BadRequestError('Please add at least one item to the order');
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Create order with initial status history
        const order = await OrderModel.create({
            user: req.user._id,
            items,
            totalAmount,
            status: 'pending',
            payment: {
                method: paymentMethod || 'cash',
                amount: totalAmount,
                status: 'pending'
            },
            specialInstructions,
            statusHistory: [{
                status: 'pending',
                changedBy: req.user._id,
                notes: 'Order created'
            }]
        });

        // Emit new order event (for real-time updates)
        const io = req.app.get('io');
        if (io) {
            io.to('staff_room').emit('newOrder', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt
            });
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (for staff)
// @route   GET /api/orders
// @access  Private (Staff)
export const getAllOrders = async (req, res, next) => {
    try {
        const { status, startDate, endDate, sort = '-createdAt' } = req.query;

        // Build query
        const query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await OrderModel.find(query)
            .populate('user', 'firstName lastName email')
            .sort(sort);

        res.status(StatusCodes.OK).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
    try {
        const orders = await OrderModel.find({ user: req.user._id })
            .populate('items.menuItem', 'name price')
            .sort('-createdAt');

        res.status(StatusCodes.OK).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('items.menuItem', 'name price description')
            .populate('statusHistory.changedBy', 'firstName lastName');

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if user is authorized to view this order
        if (order.user._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'canteen_staff') {
            throw new UnauthorizedError('Not authorized to view this order');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Staff)
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        if (!status) {
            throw new BadRequestError('Status is required');
        }

        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Update order status
        // Update order status
        order.status = status;
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status: status,
            changedBy: req.user._id,
            changedAt: new Date(),
            notes: notes || `Status changed to ${status}`
        });
        await order.save();

        // Record status change
        await OrderStatusModel.create({
            order: order._id,
            status,
            changedBy: req.user._id,
            notes: notes || `Status changed to ${status}`
        });

        // Emit status update event
        const io = req.app.get('io');
        if (io) {
            io.to(`order_${order._id}`).emit('orderStatusUpdated', {
                orderId: order._id,
                status: order.status,
                updatedAt: order.updatedAt
            });

            if (status === 'prepared') {
                io.to('staff_room').emit('orderPrepared', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    queueNumber: order.queueNumber
                });
            }
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
export const cancelOrder = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if user is authorized to cancel this order
        if (order.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'canteen_staff') {
            throw new UnauthorizedError('Not authorized to cancel this order');
        }

        // Only allow cancellation if order is still pending or preparing
        if (!['pending', 'preparing'].includes(order.status)) {
            throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
        }

        // Update order status to cancelled
        order.status = 'cancelled';
        await order.save();

        // Record status change
        await OrderStatusModel.create({
            order: order._id,
            status: 'cancelled',
            changedBy: req.user._id,
            notes: 'Order cancelled by ' + (req.user.role === 'canteen_staff' ? 'staff' : 'customer')
        });

        // Emit cancellation event
        const io = req.app.get('io');
        if (io) {
            io.to(`order_${order._id}`).emit('orderCancelled', {
                orderId: order._id,
                status: 'cancelled',
                cancelledAt: new Date()
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order status history
// @route   GET /api/orders/:id/history
// @access  Private
export const getOrderHistory = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if user is authorized to view this order
        if (order.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'canteen_staff') {
            throw new UnauthorizedError('Not authorized to view this order history');
        }

        const history = await OrderStatusModel.find({ order: order._id })
            .populate('changedBy', 'firstName lastName')
            .sort('-createdAt');

        res.status(StatusCodes.OK).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        next(error);
    }
};