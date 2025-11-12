import { StatusCodes } from 'http-status-codes';
import { MenuItem } from '../models/Menu.js';
import { Order } from '../models/Order.js';
import natural from 'natural';
import { UserModel as User } from '../models/User.js';
import mongoose from 'mongoose';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Initialize menu items for NLP
let menuItems = [];

// Function to train the chatbot with menu items
const trainChatbot = async () => {
    try {
        menuItems = await MenuItem.find({ isAvailable: true });
        menuItems.forEach(item => {
            tfidf.addDocument(`${item.name} ${item.category} ${item.description || ''}`.toLowerCase());
        });
    } catch (error) {
        console.error('Error training chatbot:', error);
    }
};

// Process natural language order
export const processOrder = async (req, res, next) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Message and userId are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Invalid userId format'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Extract quantity from message
        let quantity = 1;
        const quantityMatch = message.match(/\d+/);
        if (quantityMatch) {
            quantity = parseInt(quantityMatch[0], 10);
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
            }
        }

        // Find menu item using TF-IDF
        const matches = [];
        tfidf.tfidfs(message.toLowerCase(), (i, measure) => {
            if (measure > 0) {
                matches.push({
                    item: menuItems[i],
                    score: measure
                });
            }
        });

        if (matches.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Sorry, I couldn\'t find that item on the menu.'
            });
        }

        const bestMatch = matches[0].item;
        const totalAmount = bestMatch.price * quantity;

        // Create new order
        const newOrder = await Order.create({
            user: userId,
            items: [{
                menuItem: bestMatch._id,
                name: bestMatch.name,
                quantity,
                price: bestMatch.price
            }],
            totalAmount,
            status: 'pending',
            orderNumber: `ORD-${Date.now()}`,
            paymentMethod: 'cash',
            paymentStatus: 'pending'
        });

        return res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: `Got it! ${quantity} order${quantity > 1 ? 's' : ''} of ${bestMatch.name} has been added to your cart.`,
            data: {
                order: newOrder
            }
        });

    } catch (error) {
        console.error('Error in processOrder:', error);
        next(error);
    }
};

// Get order status
export const getOrderStatus = async (req, res, next) => {
    try {
        const { orderNumber } = req.params;

        if (!orderNumber) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Order number is required'
            });
        }

        const order = await Order.findOne({ orderNumber })
            .populate('user', 'firstName lastName')
            .populate('items.menuItem', 'name price');

        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        return res.status(StatusCodes.OK).json({
            status: 'success',
            data: { order }
        });

    } catch (error) {
        console.error('Error in getOrderStatus:', error);
        next(error);
    }
};

// Initialize chatbot
trainChatbot().catch(console.error);