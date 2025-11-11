// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: [true, 'Order must belong to a menu item']
    },
    quantity: {
        type: Number,
        required: [true, 'Please specify quantity'],
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: {
            values: ['pending', 'preparing', 'prepared', 'claimed', 'cancelled'],
            message: 'Status is either: pending, preparing, prepared, claimed, or cancelled'
        },
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
    },
    orderNumber: {
        type: String,
        unique: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'gcash'],
        required: [true, 'Please specify payment method']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentReference: String,
    specialInstructions: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.isNew) return next();

    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    next();
});

export const Order = mongoose.model('Order', orderSchema);