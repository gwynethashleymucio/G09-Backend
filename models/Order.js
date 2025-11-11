// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
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

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'preparing', 'prepared', 'claimed', 'cancelled'],
        default: 'pending',
        required: true
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    payment: {
        method: {
            type: String,
            enum: ['cash', 'gcash', 'card'],
            required: [true, 'Payment method is required']
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        referenceNumber: String,
        amount: Number,
        paidAt: Date
    },
    queueNumber: {
        type: String,
        required: function() {
            return this.status !== 'cancelled';
        }
    },
    specialInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Special instructions cannot be longer than 500 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate order number
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${(count + 1).toString().padStart(5, '0')}`;
    }
    
    // Generate queue number if not set
    if (!this.queueNumber && this.status !== 'cancelled') {
        const today = new Date();
        const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });
        this.queueNumber = `Q-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

// Virtual for order status history
orderSchema.virtual('statusHistory', {
    ref: 'OrderStatus',
    localField: '_id',
    foreignField: 'order'
});

// Indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

export const OrderModel = mongoose.model('Order', orderSchema);

// Separate collection for order status history
const orderStatusSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'preparing', 'prepared', 'claimed', 'cancelled']
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String
}, { timestamps: true });

export const OrderStatusModel = mongoose.model('OrderStatus', orderStatusSchema);