import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
const { Types: { ObjectId } } = mongoose;
import { Menu } from '../models/Menu.js';
import { Order } from '../models/Order.js';
import natural from 'natural';
import { UserModel as User } from '../models/user.js';

// Initialize mongoose ObjectId for validatio

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// In-memory store for conversation state
const conversations = new Map();

// Initialize menu items for NLP
let menuItems = [];

// Training data for intent recognition
const trainingData = [
    { input: 'I want to order {item}', output: 'order' },
    { input: 'Can I get {item}', output: 'order' },
    { input: 'I would like {item}', output: 'order' },
    { input: 'How much is {item}', output: 'price' },
    { input: 'What is the price of {item}', output: 'price' },
    { input: 'What do you have', output: 'menu' },
    { input: 'Show me your menu', output: 'menu' },
    { input: 'What can I order', output: 'menu' },
    { input: 'Hello', output: 'greeting' },
    { input: 'Hi', output: 'greeting' },
    { input: 'Thanks', output: 'thanks' },
    { input: 'Thank you', output: 'thanks' },
];

// Function to train the chatbot with menu items and intents
const trainChatbot = async () => {
    try {
        // Train with menu items
        menuItems = await Menu.find({ isAvailable: true });
        menuItems.forEach(item => {
            tfidf.addDocument(`${item.name} ${item.category} ${item.description || ''}`.toLowerCase());
        });

        // Train with intent data
        trainingData.forEach(data => {
            tfidf.addDocument(data.input.toLowerCase());
        });
    } catch (error) {
        console.error('Error training chatbot:', error);
    }
};

// Helper function to detect intent and extract entities
const detectIntent = async (message) => {
    const messageLower = message.toLowerCase().trim();

    // 0. Check for checkout/confirm intent first
    if (messageLower.match(/^(checkout|place order|confirm order|i'm done|that's all|proceed to checkout)$/i)) {
        return { intent: 'checkout' };
    }

    // 1. Check for greetings (quick exit if it's just a greeting)
    if (/(^|\s)(hello|hi|hey|greetings?|good\s(morning|afternoon|evening))(\s|$)/i.test(messageLower)) {
        return { intent: 'greeting' };
    }

    // 2. Check for order intent
    const orderMatch = message.toLowerCase().match(/(?:i'?d like|i want|can i have|give me|get me|add|i'll have|i will have|let me get|let me have)\s+(?:a|an|the)?\s*([a-zA-Z\s]+)/i);
    if (orderMatch) {
        console.log('Order match found:', orderMatch[1].trim());
        const mentionedItem = orderMatch[1].trim();
        if (mentionedItem) {
            // First check database for exact match
            const dbItem = await Menu.findOne({
                name: { $regex: new RegExp(`^${mentionedItem}$`, 'i') },
                isAvailable: true
            });

            if (dbItem) {
                const quantityMatch = message.match(/\d+/);
                const quantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 1;

                return {
                    intent: 'order',
                    item: dbItem.name,
                    itemId: dbItem._id,
                    price: dbItem.price,
                    quantity: quantity,
                    confidence: 1.0,
                    matchType: 'exact'
                };
            }

            // If no exact match, try fuzzy search
            const allMenuItems = await Menu.find({ isAvailable: true });
            const matches = [];

            allMenuItems.forEach(item => {
                const itemName = item.name.toLowerCase();
                const itemWords = itemName.split(/\s+/);
                const matchedWords = itemWords.filter(word =>
                    word.length > 3 &&
                    new RegExp(`\\b${word}\\b`, 'i').test(mentionedItem)
                );

                if (matchedWords.length > 0) {
                    const confidence = matchedWords.length / itemWords.length;
                    matches.push({
                        ...item.toObject(),
                        confidence,
                        matchType: confidence === 1 ? 'exact' : 'partial'
                    });
                }
            });

            if (matches.length > 0) {
                // Sort by confidence (highest first)
                matches.sort((a, b) => b.confidence - a.confidence);
                const bestMatch = matches[0];
                const quantityMatch = message.match(/\d+/);
                const quantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 1;

                return {
                    intent: 'order',
                    item: bestMatch.name,
                    itemId: bestMatch._id,
                    price: bestMatch.price,
                    quantity: quantity,
                    confidence: bestMatch.confidence,
                    matchType: bestMatch.matchType
                };
            }

            // If no matches found
            return {
                intent: 'item_not_found',
                originalItem: mentionedItem,
                suggestions: allMenuItems ? allMenuItems.map(item => item.name).slice(0, 3) : []
            };
        }
    }

    // 4. Check for menu requests
    if (/(show|what'?s|what is|list|see|view).*(menu|items?|food|drinks?|meals?)/i.test(messageLower) ||
        /(what (do you have|can i order|is available)|menu)/i.test(messageLower)) {
        return { intent: 'menu' };
    }

    // 5. Check for price inquiries
    const priceMatch = messageLower.match(/(?:how much|what'?s the price|price of|cost of|how much is|how much for)\s*(?:a|an|the)?\s*([a-zA-Z\s]+)/i);
    if (priceMatch) {
        return {
            intent: 'price',
            item: priceMatch[1].trim()
        };
    }

    // 6. Default to unknown intent with suggestions
    return {
        intent: 'unknown',
        suggestions: [
            'Try saying: "I want to order a burger"',
            'Or: "What\'s on the menu?"',
            'Or: "How much is the pizza?"'
        ]
    };
};

// Helper function to find menu items in message
const findMentionedItems = (message, items) => {
    const messageLower = message.toLowerCase().trim();
    const mentioned = [];

    items.forEach(item => {
        const itemName = item.name.toLowerCase();
        const itemWords = itemName.split(/\s+/);

        // Check for exact match (whole word)
        const exactMatch = new RegExp(`\\b${itemName}\\b`, 'i').test(message);
        if (exactMatch) {
            mentioned.push({
                ...item.toObject(),
                matchType: 'exact',
                confidence: 1.0
            });
            return;
        }

        // Check for partial matches (individual words)
        const matchedWords = itemWords.filter(word =>
            word.length > 3 &&
            new RegExp(`\\b${word}\\b`, 'i').test(message)
        );

        if (matchedWords.length > 0) {
            const confidence = matchedWords.length / itemWords.length;
            if (confidence >= 0.5) { // Require at least 50% match
                mentioned.push({
                    ...item.toObject(),
                    matchType: 'partial',
                    confidence,
                    matchedWords
                });
            }
        }
    });

    return mentioned.sort((a, b) => b.confidence - a.confidence);
};

// Generate response based on intent
const generateResponse = (intent, data = {}) => {
    const responses = {
        greeting: [
            'Hello! How can I help you today?',
            'Hi there! What would you like to order?',
            'Welcome to SDCA Canteen! How may I assist you with your order today?'
        ],
        order: [
            `Got it! I've added ${data.quantity} ${data.itemName}${data.quantity > 1 ? 's' : ''} to your order. Would you like to add anything else?`,
            `Perfect choice! ${data.quantity} ${data.itemName}${data.quantity > 1 ? 's have' : ' has'} been added to your order. What else would you like?`,
            `Added ${data.quantity} ${data.itemName}${data.quantity > 1 ? 's' : ''} (₱${data.price * data.quantity}) to your order. Would you like anything else?`
        ],
        price: [
            `${data.itemName} costs ₱${data.price} each.`
        ],
        menu: [
            'Here are our available items:',
            'Our menu includes:'
        ],
        thanks: [
            'You\'re welcome! Is there anything else I can help you with?',
            'Happy to help! Let me know if you need anything else.'
        ],
        default: [
            'I\'m not sure I understand. Could you rephrase that?',
            'I didn\'t catch that. Could you say that again?',
            'I\'m still learning. Could you try asking in a different way?'
        ]
    };

    const possibleResponses = responses[intent] || responses.default;
    return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
};

// Process natural language order
export const processOrder = async (req, res, next) => {
    try {
        // Reload menu items before processing each request
        await trainChatbot();

        const { message, sessionId } = req.body;
        const userId = req.user?._id; // Get user ID from authenticated session

        // Debug log
        req.logger?.info('Chatbot intent detected', {
            message,
            userId,
            sessionId,
            menuItems: menuItems.map(m => m.name)
        });

        if (!message) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: 'Message is required'
            });
        }

        // Get or create conversation state
        const conversationId = sessionId || `conv-${Date.now()}`;
        let conversation = conversations.get(conversationId) || {
            state: 'initial',
            orderItems: [],
            lastMessage: ''
        };

        // Debug log for conversation state
        console.log('Conversation state:', {
            state: conversation.state,
            orderItems: conversation.orderItems,
            lastMessage: conversation.lastMessage
        });

        // Check for add/modify commands first if in confirming state
        if (conversation.state === 'confirming' && /(add|also|and|with|plus|\+)/i.test(message)) {
            // Extract items to add (remove command words)
            const itemsToAdd = message.replace(/(add|also|and|with|plus|\+)/gi, '').trim();
            const { intent: addIntent, item: mentionedItem } = detectIntent(itemsToAdd);

            if (addIntent === 'order' && mentionedItem) {
                // Process the addition
                const matches = [];
                tfidf.tfidfs(mentionedItem.toLowerCase(), (i, measure) => {
                    if (measure > 0) {
                        matches.push({
                            item: menuItems[i],
                            score: measure
                        });
                    }
                });

                if (matches.length > 0) {
                    const bestMatch = matches[0].item;
                    const quantityMatch = itemsToAdd.match(/\d+/) || message.match(/\d+/);
                    const quantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 1;

                    // Add to existing order items
                    conversation.orderItems.push({
                        menu: bestMatch._id,
                        name: bestMatch.name,
                        quantity,
                        price: bestMatch.price
                    });

                    response = generateResponse('order', {
                        itemName: bestMatch.name,
                        quantity,
                        price: bestMatch.price
                    });
                    conversation.state = 'confirming';

                    // Update the conversation in the map
                    conversations.set(conversationId, conversation);

                    // Prepare the response
                    const total = conversation.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                    return res.status(StatusCodes.OK).json({
                        status: 'success',
                        message: response,
                        sessionId: conversationId,
                        state: conversation.state,
                        currentOrder: {
                            items: conversation.orderItems,
                            total: total
                        }
                    });
                }
            }
        }

        // Detect intent for normal flow
        const intentData = await detectIntent(message);
        const { intent, item: mentionedItem, quantity = 1, itemId, price } = intentData;
        let response = '';
        let order = null;

        // Debug log for detected intent
        console.log('Detected intent:', JSON.stringify(intentData, null, 2));

        // Handle different intents
        switch (intent) {
            case 'order':
                if (mentionedItem && itemId) {
                    // Add to order items
                    const existingItemIndex = conversation.orderItems.findIndex(
                        item => item.menu.toString() === itemId.toString()
                    );

                    if (existingItemIndex >= 0) {
                        // Update quantity if item already exists
                        conversation.orderItems[existingItemIndex].menu = itemId;
                        conversation.orderItems[existingItemIndex].quantity += quantity;
                    } else {
                        // Add new item
                        conversation.orderItems.push({
                            menu: itemId,
                            name: mentionedItem,
                            quantity: quantity,
                            price: price
                        });
                    }

                    response = `Added ${quantity} ${mentionedItem}${quantity > 1 ? 's' : ''} to your order. `;
                    response += `Would you like to add anything else?`;
                    conversation.state = 'confirming';
                } else {
                    response = `I'm sorry, I couldn't find "${mentionedItem}" on our menu.`;

                    // Try to suggest similar items
                    const allItems = await Menu.find({ isAvailable: true });
                    if (allItems.length > 0) {
                        const suggestions = allItems
                            .map(item => item.name)
                            .filter(name => name.toLowerCase().includes(mentionedItem.toLowerCase()))
                            .slice(0, 3);

                        if (suggestions.length > 0) {
                            response += ` Did you mean: ${suggestions.join(', ')}?`;
                        } else {
                            response += ` Here are some available items: ${allItems.slice(0, 3).map(i => i.name).join(', ')}`;
                        }
                    }
                }
                break;

            case 'price':
                if (mentionedItem) {
                    // Find the item price
                    const matches = [];
                    tfidf.tfidfs(mentionedItem.toLowerCase(), (i, measure) => {
                        if (measure > 0) {
                            matches.push({
                                item: menuItems[i],
                                score: measure
                            });
                        }
                    });

                    if (matches.length > 0) {
                        const bestMatch = matches[0].item;
                        response = generateResponse('price', {
                            itemName: bestMatch.name,
                            price: bestMatch.price
                        });
                    } else {
                        response = `I couldn't find pricing for ${mentionedItem}.`;
                    }
                } else {
                    response = 'Which item would you like to know the price of?';
                }
                break;

            case 'menu':
                response = generateResponse('menu') + '\n';
                response += menuItems.map(item =>
                    `- ${item.name}: ₱${item.price} (${item.category})`
                ).join('\n');
                break;

            case 'greeting':
            case 'thanks':
                response = generateResponse(intent);
                break;

            case 'checkout':
            case 'confirm':
                // User ID should already be validated by the protect middleware
                if (!userId) {
                    console.log('No user ID found in session');
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        status: 'error',
                        message: 'User session error. Please try logging in again.',
                        sessionId: conversationId,
                        state: conversation.state
                    });
                }

                if (conversation.orderItems.length === 0) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        status: 'error',
                        message: 'Your order is empty. Please add items before checking out.',
                        sessionId: conversationId,
                        state: conversation.state
                    });
                }

                try {
                    // Get authenticated user details
                    const user = await User.findById(userId).select('firstName lastName email').lean();
                    if (!user) {
                        console.error('User not found:', userId);
                        return res.status(StatusCodes.UNAUTHORIZED).json({
                            status: 'error',
                            message: 'User account not found. Please log in again.',
                            sessionId: conversationId,
                            state: conversation.state
                        });
                    }

                    // Calculate total amount
                    const totalAmount = conversation.orderItems.reduce(
                        (sum, item) => sum + (item.price * item.quantity), 0
                    );

                    const customerName = `${user.firstName} ${user.lastName}`;
                    const customerEmail = user.email || 'no-email@example.com';

                    // Prepare order items
                    const orderItems = conversation.orderItems.map(item => ({
                        menu: item.menu,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    }));

                    // Create the order with all necessary details
                    const orderData = {
                        items: orderItems,
                        totalAmount,
                        status: 'pending',
                        orderNumber: `ORD-${Date.now()}`,
                        queueNumber: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
                        payment: {
                            method: 'cash',
                            amount: totalAmount,
                            status: 'pending'
                        },
                        customerName,
                        customerEmail,
                        user: new ObjectId(userId)  // Set the user reference
                    };

                    console.log('Creating order with data:', {
                        ...orderData,
                        items: orderData.items.map(i => ({
                            ...i,
                            menu: i.menu.toString()
                        }))
                    });

                    // Create the order
                    order = await Order.create(orderData);
                    console.log('Order created successfully:', {
                        id: order._id,
                        orderNumber: order.orderNumber,
                        status: order.status,
                        total: order.totalAmount
                    });

                    // Format order summary
                    const orderSummary = conversation.orderItems
                        .map(item => `  • ${item.quantity}x ${item.name} - ₱${item.price * item.quantity}`)
                        .join('\n');

                    response = `✅ *Order Confirmed!*\n\n` +
                        `*Order #${order.orderNumber}*\n` +
                        `*Customer:* ${user.firstName} ${user.lastName}\n` +
                        `*Items:*\n${orderSummary}\n` +
                        `*Total Amount:* ₱${totalAmount.toFixed(2)}\n\n` +
                        'Please proceed to the counter for payment. ' +
                        'You can check your order status anytime by saying "Check my order status".';

                    // Reset conversation
                    conversation = {
                        state: 'initial',
                        orderItems: [],
                        lastMessage: ''
                    };
                } catch (error) {
                    console.error('Error creating order:', {
                        message: error.message,
                        stack: error.stack,
                        userId: userId,
                        orderData: orderData ? {
                            ...orderData,
                            items: orderData.items ? orderData.items.map(i => ({
                                ...i,
                                menu: i.menu ? i.menu.toString() : 'invalid-menu-item'
                            })) : 'no-items'
                        } : 'No order data was created before error'
                    });
                    response = 'Sorry, there was an error processing your order. Please try again.';

                    // Send error response and return to avoid further processing
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        status: 'error',
                        message: response,
                        sessionId: conversationId,
                        state: conversation.state
                    });
                }
                break;
                break;

            case 'cancel':
                conversation = {
                    state: 'initial',
                    orderItems: [],
                    lastMessage: ''
                };
                response = 'Your order has been cancelled. How can I help you?';

                // Save the conversation state
                conversations.set(conversationId, conversation);

                return res.status(StatusCodes.OK).json({
                    status: 'success',
                    message: response,
                    sessionId: conversationId,
                    state: conversation.state
                });
                break;

            case 'item_not_found':
                response = `I couldn't find "${intentData.originalItem}" on our menu. `;
                if (intentData.suggestions && intentData.suggestions.length > 0) {
                    response += `Did you mean: ${intentData.suggestions.join(', ')}?`;
                } else {
                    response += 'Please check our menu and try again.';
                }
                break;

            // If it's a new session
            case 'greeting':
                response = '👋 *Welcome to our canteen!* I can help you with:\n\n' +
                    '• *Order food* (e.g., "I want a cheeseburger")\n' +
                    '• *Check menu* to see what\'s available\n' +
                    '• *Check order status* for existing orders\n' +
                    '• *Help* to see all commands\n\n' +
                    'What would you like to do?';
                break;

            default:
                response = "I'm not sure how to help with that. You can ask me to order food, check the menu, or check your order status.";
        }

        // Prepare response
        const responseObj = {
            status: 'success',
            message: response,
            sessionId: conversationId,
            state: conversation.state,
            order: order ? {
                id: order._id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                status: order.status
            } : null
        };

        // Add order items if in ordering state
        if (conversation.orderItems.length > 0) {
            responseObj.currentOrder = {
                items: conversation.orderItems,
                total: conversation.orderItems.reduce(
                    (sum, item) => sum + (item.price * item.quantity), 0
                )
            };
        }

        // Save the conversation state
        conversations.set(conversationId, conversation);

        return res.status(StatusCodes.OK).json(responseObj);

    } catch (error) {
        console.error('Error processing order:', error);
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
            .populate('items.menu', 'name price');

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

// Debug endpoint to check available menu items
export const debugMenuItems = async (req, res) => {
    try {
        const items = await Menu.find({});
        res.status(200).json({
            status: 'success',
            count: items.length,
            items: items.map(item => ({
                id: item._id,
                name: item.name,
                price: item.price,
                category: item.category,
                isAvailable: item.isAvailable
            }))
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch menu items' });
    }
};

// Initialize chatbot
trainChatbot().catch(console.error);