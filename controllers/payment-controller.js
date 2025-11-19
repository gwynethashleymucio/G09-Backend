// controllers/paymentController.js
import { StatusCodes } from 'http-status-codes';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../middleware/error-middleware.js';

/**
 * @desc    Create a new payment
 * @route   POST /api/payments
 * @access  Private
 */
export const createPayment = async (req, res, next) => {
    try {
        const { orderId, method, referenceNumber, screenshotUrl, senderName, senderNumber } = req.body;

        // Get the order
        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Check if order belongs to the user
        if (order.user.toString() !== req.user._id.toString()) {
            throw new UnauthorizedError('Not authorized to create payment for this order');
        }

        // Check if order already has a payment
        const existingPayment = await Payment.findOne({ order: orderId });
        if (existingPayment) {
            throw new BadRequestError('Payment already exists for this order');
        }

        // Create payment
        const payment = await Payment.create({
            order: orderId,
            user: req.user._id,
            amount: order.totalAmount,
            method,
            ...(method === 'gcash' && {
                referenceNumber,
                screenshotUrl,
                senderName,
                senderNumber
            }),
            status: method === 'cash' ? 'paid' : 'pending',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        // Update order status if payment is cash
        if (method === 'cash') {
            order.status = 'paid';
            order.statusHistory.push({
                status: 'paid',
                changedBy: req.user._id,
                notes: 'Paid with cash'
            });
            await order.save();
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: { payment }
        });

    } catch (error) {
        next(error);
    }
};

// Add these exports at the end of your paymentController.js file

/**
 * @desc    Get all payments (admin only)
 * @route   GET /api/payments
 * @access  Private/Admin
 */
export const getAllPayments = async (req, res, next) => {
    try {
        const { status, method, startDate, endDate } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (method) filter.method = method;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const payments = await Payment.find(filter)
            .sort('-createdAt')
            .populate('user', 'name email')
            .populate('order', 'orderNumber totalAmount status');

        res.status(StatusCodes.OK).json({
            success: true,
            count: payments.length,
            data: { payments }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('order', 'orderNumber totalAmount status');

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        // Check if user is authorized to view this payment
        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'canteen_staff') {
            throw new UnauthorizedError('Not authorized to view this payment');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: { payment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update payment status (admin only)
 * @route   PATCH /api/payments/:id/status
 * @access  Private/Admin
 */
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        // Update payment status
        payment.status = status;
        payment.verificationNotes = notes || payment.verificationNotes;

        if (status === 'paid') {
            payment.verified = true;
            payment.verifiedAt = new Date();
            payment.verifiedBy = req.user._id;

            // Update order status to 'paid'
            await Order.findByIdAndUpdate(payment.order, {
                status: 'paid',
                $push: {
                    statusHistory: {
                        status: 'paid',
                        changedBy: req.user._id,
                        notes: 'Payment verified and order marked as paid'
                    }
                }
            });
        }

        await payment.save();

        res.status(StatusCodes.OK).json({
            success: true,
            data: { payment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logged in user's payments
 * @route   GET /api/payments/my-payments
 * @access  Private
 */
export const getMyPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .sort('-createdAt')
            .populate('order', 'orderNumber totalAmount status');

        res.status(StatusCodes.OK).json({
            success: true,
            count: payments.length,
            data: { payments }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Process GCash webhook
 * @route   POST /api/payments/webhook/gcash
 * @access  Public (GCash server)
 */
export const processGCashWebhook = async (req, res, next) => {
    try {
        // Verify webhook signature in production
        const { referenceNumber, status, metadata } = req.body;

        const payment = await Payment.findOne({ referenceNumber });
        if (!payment) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Update payment status
        payment.status = status === 'success' ? 'paid' : 'failed';
        payment.metadata = { ...payment.metadata, ...metadata };

        if (payment.status === 'paid') {
            payment.verified = true;
            payment.verifiedAt = new Date();

            // Update order status
            await Order.findByIdAndUpdate(payment.order, {
                status: 'paid',
                $push: {
                    statusHistory: {
                        status: 'paid',
                        notes: 'Payment verified via GCash webhook'
                    }
                }
            });
        }

        await payment.save();

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Webhook processed successfully'
        });
    } catch (error) {
        console.error('GCash webhook error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error processing webhook'
        });
    }
};