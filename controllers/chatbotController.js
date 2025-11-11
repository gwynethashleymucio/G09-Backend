import { StatusCodes } from 'http-status-codes';
import { MenuModel } from '../models/Menu.js';
import { OrderModel } from '../models/Order.js';
import natural from 'natural';
import { UserModel } from './user.js';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Initialize menu items for NLP
let menuItems = [];

// Function to train the chatbot with menu items
const trainChatbot = async () => {
    try {
        menuItems = await MenuModel.find({ isAvailable: true });
        
        // Add menu items to TF-IDF for better matching
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
        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Simple NLP to extract quantity and item
        const tokens = tokenizer.tokenize(message.toLowerCase());
        let quantity = 1;
        const quantityMatch = message.match(/\d+/);
        if (quantityMatch) {
            quantity = parseInt(quantityMatch[0], 10);
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

        // Sort by best match
        matches.sort((a, b) => b.score - a.score);
        
        if (matches.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Sorry, I couldn\'t find that item on the menu.'
            });
        }

        const bestMatch = matches[0].item;
        
        // Create new order
        const newOrder = await OrderModel.create({
            user: userId,
            items: [{
                menuItem: bestMatch._id,
                quantity,
                price: bestMatch.price
            }],
            totalAmount: bestMatch.price * quantity,
            status: 'pending',
            orderNumber: `ORD-${Date.now()}`,
            paymentMethod: 'cash', // Default payment method
            paymentStatus: 'pending'
        });

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: `Got it! ${quantity} order${quantity > 1 ? 's' : ''} of ${bestMatch.name} has been added to your cart.`,
            data: {
                order: newOrder
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get order status
export const getOrderStatus = async (req, res, next) => {
    try {
        const { orderNumber } = req.params;
        const order = await OrderModel.findOne({ orderNumber })
            .populate('user', 'firstName lastName')
            .populate('items.menuItem', 'name price');

        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        next(error);
    }
};

// Initialize chatbot
trainChatbot().catch(console.error);
