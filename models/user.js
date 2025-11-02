import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    firstName: {
        type:String,
        required: [true, 'First Name is required.']
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        validate: {
            validator: (v) => v.endsWith('@sdca.edu.ph'),
            message: 'Email must be an sdca.edu.ph address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required.']
    }
})

export const UserModel = mongoose.model('User', userSchema)

