# Canteen Management System API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Menu](#menu)
4. [Orders](#orders)
5. [Chatbot](#chatbot)
6. [Testing](#testing)

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register a New User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@sdca.edu.ph",
    "password": "password123",
    "userType": "student"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "token": "jwt.token.here",
    "data": {
      "user": {
        "_id": "...",
        "firstName": "John",
        "email": "john.doe@sdca.edu.ph"
      }
    }
  }
  ```

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "email": "john.doe@sdca.edu.ph",
    "password": "password123"
  }
  ```

## Users

### Get Current User
- **URL**: `/users/me`
- **Method**: `GET`
- **Authentication**: Required
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```

## Menu

### Get All Menu Items
- **URL**: `/menu`
- **Method**: `GET`
- **Authentication**: Not required

### Create Menu Item (Staff Only)
- **URL**: `/menu`
- **Method**: `POST`
- **Authentication**: Required (Staff only)
- **Request Body**:
  ```json
  {
    "name": "Burger",
    "description": "Delicious beef burger",
    "price": 5.99,
    "category": "Main Course",
    "isAvailable": true
  }
  ```

## Orders

### Create Order
- **URL**: `/orders`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "items": [
      {
        "menuItem": "<menu_item_id>",
        "quantity": 2,
        "specialInstructions": "No onions"
      }
    ],
    "paymentMethod": "cash"
  }
  ```

### Get User's Orders
- **URL**: `/orders/my-orders`
- **Method**: `GET`
- **Authentication**: Required

### Update Order Status (Staff Only)
- **URL**: `/orders/:id/status`
- **Method**: `PATCH`
- **Authentication**: Required (Staff only)
- **Request Body**:
  ```json
  {
    "status": "preparing"
  }
  ```
  
## Chatbot

### Process Chat Message
- **URL**: `/chatbot/process`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "message": "I want to order 2 burgers"
  }
  ```

## Testing

### Environment Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

### Testing with Postman
1. Create a new collection
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: (will be set after login)
3. Test endpoints in this order:
   1. Register User
   2. Login (saves token )
   3. Create Order
   4. Get Orders

### Common Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`
