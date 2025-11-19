// models/Menu.js
import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menu item name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['main', 'beverage', 'snack', 'dessert'],
            message: 'Category is either: main, beverage, snack, or dessert'
        }
    },
    imageUrl: {
        type: String,
        default: 'default.jpg'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

export const Menu = mongoose.model('Menu', menuSchema);