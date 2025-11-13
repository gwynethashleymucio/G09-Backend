// models/Order.js
import mongoose from 'mongoose';

// Function to generate queue number (e.g., Q-1234)
const generateQueueNumber = () => `Q-${Math.floor(1000 + Math.random() * 9000)}`;

// Function to generate order number (e.g., ORD-20231113-1234)
const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/\D/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${dateStr}-${randomNum}`;
};

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: [true, 'Order must belong to a menu item']
    },
    name: {
        type: String,
        required: [true, 'Item name is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Please specify quantity'],
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    notes: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Made optional for guest orders
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    orderNumber: {
        type: String,
        unique: true,
        index: true
    },
    queueNumber: {
        type: String,
        index: true
    },
    payment: {
        method: {
            type: String,
            enum: ['cash', 'gcash', 'paymaya'],
            default: 'cash'
        },
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0, 'Payment amount cannot be negative']
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        }
    },
    specialInstructions: {
        type: String,
        trim: true
    },
    statusHistory: [statusHistorySchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to generate order and queue numbers
orderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        this.orderNumber = generateOrderNumber();
    }
    if (!this.queueNumber) {
        this.queueNumber = generateQueueNumber();
    }
    next();
});

// Calculate total amount before saving
orderSchema.pre('save', function (next) {
    if (this.isModified('items')) {
        this.totalAmount = this.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        this.payment.amount = this.totalAmount;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export { Order };