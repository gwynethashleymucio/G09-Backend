// socket.js
import { Server } from 'socket.io';
import { Order as OrderModel } from './models/Order.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }
    });

    // Track connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle user authentication
        socket.on('authenticate', (userId) => {
            if (userId) {
                connectedUsers.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} connected with socket ${socket.id}`);
            }
        });

        // Join order room for real-time updates
        socket.on('joinOrderRoom', (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
        });

        // Join staff room for order notifications
        socket.on('joinStaffRoom', () => {
            socket.join('staff_room');
            console.log(`Staff member ${socket.userId} joined staff room`);
        });

        // Handle order status updates
        socket.on('updateOrderStatus', async ({ orderId, status, userId }) => {
            try {
                const order = await OrderModel.findByIdAndUpdate(
                    orderId,
                    { status },
                    { new: true }
                ).populate('user', 'firstName lastName');

                if (!order) {
                    return socket.emit('error', { message: 'Order not found' });
                }

                // Notify customer about status update
                io.to(`order_${orderId}`).emit('orderStatusUpdated', {
                    orderId,
                    status,
                    updatedAt: order.updatedAt
                });

                // Notify staff about the update
                io.to('staff_room').emit('staffOrderUpdate', {
                    orderId,
                    status,
                    updatedBy: userId,
                    updatedAt: order.updatedAt
                });

                console.log(`Order ${orderId} status updated to ${status}`);
            } catch (error) {
                console.error('Error updating order status:', error);
                socket.emit('error', { message: 'Failed to update order status' });
            }
        });

        // Handle new order notifications
        socket.on('newOrder', async (order) => {
            try {
                // Notify all staff members
                io.to('staff_room').emit('newOrderNotification', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    customerName: order.user?.firstName + ' ' + order.user?.lastName,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    createdAt: order.createdAt
                });
                console.log(`New order notification sent for order ${order._id}`);
            } catch (error) {
                console.error('Error sending new order notification:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
            }
        });
    });

    return io;
};

// Helper function to get socket instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Helper function to send notification to a specific user
export const notifyUser = (userId, event, data) => {
    const io = getIO();
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
    } else {
        console.log(`User ${userId} is not connected`);
    }
};