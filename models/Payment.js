// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    // Core References
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order reference is required'],
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },

    // Payment Details
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
        set: val => Math.round(val * 100) / 100 // Ensure 2 decimal places
    },
    currency: {
        type: String,
        default: 'PHP',
        enum: ['PHP']
    },
    method: {
        type: String,
        enum: ['cash', 'gcash'],
        required: [true, 'Payment method is required']
    },

    // GCash Specific Fields
    referenceNumber: {
        type: String,
        required: [
            function () { return this.method === 'gcash'; },
            'Reference number is required for GCash payments'
        ],
        index: true
    },
    screenshotUrl: {
        type: String,
        required: [
            function () { return this.method === 'gcash'; },
            'Payment proof is required for GCash payments'
        ]
    },
    senderName: String,
    senderNumber: String,

    // Status Management
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    statusHistory: [{
        status: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],

    // Verification
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationNotes: String,

    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceId: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ user: 1, status: 1 });

// Pre-save hook for status history
paymentSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.statusHistory = this.statusHistory || [];
        this.statusHistory.push({
            status: this.status,
            changedBy: this.verifiedBy || this.user,
            notes: this.verificationNotes || 'Status updated'
        });
    }
    next();
});

// Virtuals
paymentSchema.virtual('formattedAmount').get(function () {
    return `₱${this.amount.toFixed(2)}`;
});

// Static Methods
paymentSchema.statics.getUserPayments = async function (userId, status) {
    const match = { user: new mongoose.Types.ObjectId(userId) };
    if (status) match.status = status;

    return this.find(match)
        .sort({ createdAt: -1 })
        .populate('order', 'orderNumber totalAmount status');
};

// Instance Methods
paymentSchema.methods.verifyPayment = async function (userId, notes = '') {
    this.verified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = userId;
    this.verificationNotes = notes;
    this.status = 'paid';
    return this.save();
};

export const Payment = mongoose.model('Payment', paymentSchema);