import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


const payload = {
    id: '69122ab0f9e4ecd413c878ed',   
    email: 'johndoe@sdca.edu.ph'
};


const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d'      
});

console.log('Generated JWT:', token);
