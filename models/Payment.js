// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Payment must belong to an order']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    referenceNumber: {
        type: String,
        required: [true, 'Reference number is required']
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'gcash'],
        required: [true, 'Payment method is required']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDetails: Object
}, {
    timestamps: true
});

export const Payment = mongoose.model('Payment', paymentSchema);