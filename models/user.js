// models/user.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First Name is required.'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is required.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (v) => v.endsWith('@sdca.edu.ph'),
            message: 'Email must be an sdca.edu.ph address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: 6,
        select: false
    },
    userType: {
        type: String,
        enum: ['student', 'faculty', 'canteen_staff'],
        required: [true, 'User type is required.']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

export const UserModel = mongoose.model('User', userSchema);
