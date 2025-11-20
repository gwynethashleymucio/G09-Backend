# 🍽️ SDCA Canteen Ordering System - Backend (G09)

Welcome to the backend repository for the **SDCA Canteen Ordering System**. This robust Node.js application powers a modern canteen experience, featuring real-time order tracking, a smart AI chatbot for ordering, and comprehensive menu management.

## 🚀 Project Overview

This backend serves as the core engine for the canteen application, handling:
- **User Authentication**: Secure login/signup for Students, Faculty, and Canteen Staff.
- **Menu Management**: Dynamic menu creation and updates.
- **Order Processing**: Real-time order creation, status tracking, and history.
- **AI Chatbot**: A Natural Language Processing (NLP) powered chatbot that allows users to order food, check prices, and view the menu using natural conversation.
- **Real-time Updates**: Socket.io integration for instant order notifications to staff and status updates to customers.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **AI/NLP**: [Natural](https://github.com/NaturalNode/natural) (Tokenization, TF-IDF)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-Validator

---

## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gwynethashleymucio/G09-Backend.git
   cd G09-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_LIFETIME=1d
   ```

4. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

---

## 📡 API Documentation

**Base URLs:**
- **Local Development**: `http://localhost:5000/api`
- **Production (Render)**: `https://g09-backend.onrender.com/api`

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/register` | Register a new user (Student/Faculty/Staff) | Public |
| `POST` | `/login` | Login and receive JWT token | Public |

**Register Requirements:**
- `firstName`, `lastName`: Required
- `email`: Must be a valid `@sdca.edu.ph` email address
- `password`: Minimum 6 characters
- `userType`: Must be one of: `student`, `faculty`, `canteen_staff`

**Examples:**

<details>
<summary>Register a new student</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@sdca.edu.ph",
    "password": "securepass123",
    "userType": "student"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@sdca.edu.ph",
    "userType": "student"
  }
}
```
</details>

<details>
<summary>Login</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.delacruz@sdca.edu.ph",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@sdca.edu.ph",
    "userType": "student"
  }
}
```
</details>

### 👤 Users (`/users`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `GET` | `/me` | Get current logged-in user profile | Private |
| `PUT` | `/me` | Update current user's profile | Private |
| `DELETE` | `/me` | Delete current user's account | Private |

**Examples:**

<details>
<summary>Get current user profile</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@sdca.edu.ph",
    "userType": "student",
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```
</details>

<details>
<summary>Update user profile</summary>

```bash
curl -X PUT https://g09-backend.onrender.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan Carlos",
    "lastName": "Dela Cruz"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Juan Carlos",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@sdca.edu.ph",
    "userType": "student"
  }
}
```
</details>

### 🍔 Menu (`/menu`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `GET` | `/` | Get all available menu items | Public |
| `POST` | `/` | Add a new menu item | Staff Only |

**Examples:**

<details>
<summary>Get all menu items</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/menu
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Chicken Burger",
      "description": "Crispy chicken patty with lettuce and mayo",
      "price": 45,
      "category": "Main Course",
      "available": true,
      "image": "https://example.com/burger.jpg"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Taho",
      "description": "Sweet silken tofu dessert",
      "price": 15,
      "category": "Dessert",
      "available": true
    }
  ]
}
```
</details>

<details>
<summary>Create a new menu item (Staff only)</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/menu \
  -H "Authorization: Bearer STAFF_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spaghetti",
    "description": "Classic Filipino-style spaghetti",
    "price": 50,
    "category": "Main Course",
    "available": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Spaghetti",
    "description": "Classic Filipino-style spaghetti",
    "price": 50,
    "category": "Main Course",
    "available": true,
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```
</details>

### 📦 Orders (`/orders`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/` | Create a new order | Private (Students/Faculty) |
| `GET` | `/` | Get all orders | Staff Only |
| `GET` | `/my-orders` | Get current user's orders | Private |
| `GET` | `/:id` | Get specific order details | Staff Only |
| `GET` | `/:id/history` | Get order status change history | Private |
| `PATCH` | `/:id/status` | Update order status | Staff Only |
| `DELETE` | `/:id` | Cancel an order | Private (Order Owner) |

**Examples:**

<details>
<summary>Create a new order</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "menuItem": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "price": 45
      },
      {
        "menuItem": "507f1f77bcf86cd799439012",
        "quantity": 1,
        "price": 15
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "orderNumber": "ORD-20251120-001",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "menuItem": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Chicken Burger",
          "price": 45
        },
        "quantity": 2,
        "price": 45
      },
      {
        "menuItem": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Taho",
          "price": 15
        },
        "quantity": 1,
        "price": 15
      }
    ],
    "totalAmount": 105,
    "status": "pending",
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```
</details>

<details>
<summary>Get my orders</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "orderNumber": "ORD-20251120-001",
      "totalAmount": 105,
      "status": "preparing",
      "createdAt": "2025-11-20T10:30:00.000Z",
      "items": [
        {
          "menuItem": {
            "name": "Chicken Burger"
          },
          "quantity": 2,
          "price": 45
        }
      ]
    }
  ]
}
```
</details>

<details>
<summary>Update order status (Staff only)</summary>

```bash
curl -X PATCH https://g09-backend.onrender.com/api/orders/507f1f77bcf86cd799439020/status \
  -H "Authorization: Bearer STAFF_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready"
  }'
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "orderNumber": "ORD-20251120-001",
    "status": "ready",
    "updatedAt": "2025-11-20T10:45:00.000Z"
  }
}
```
</details>

<details>
<summary>Get order history</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/orders/507f1f77bcf86cd799439020/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "status": "pending",
      "timestamp": "2025-11-20T10:30:00.000Z"
    },
    {
      "status": "preparing",
      "timestamp": "2025-11-20T10:35:00.000Z"
    },
    {
      "status": "ready",
      "timestamp": "2025-11-20T10:45:00.000Z"
    }
  ]
}
```
</details>

### 🤖 AI Chatbot (`/chatbot`)
The chatbot uses NLP to understand user intents.
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/process-order` | Send a message to the bot (e.g., "I want a burger") | Private |
| `GET` | `/order-status/:orderNumber` | Check status of a specific order | Private |
| `GET` | `/debug/menu-items` | Debug endpoint to check available menu items | Public |

**Chatbot Capabilities:**
- **Ordering**: "I want 2 burgers and a coke"
- **Price Check**: "How much is the spaghetti?"
- **Menu Inquiry**: "What do you have?"
- **Order Status**: "Check my order status"

**Examples:**

<details>
<summary>Process a chatbot order</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/chatbot/process-order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want 2 chicken burgers and a taho"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "Great! I've added 2 Chicken Burgers and 1 Taho to your order. Your total is ₱105. Would you like to confirm this order?",
  "intent": "order",
  "items": [
    {
      "name": "Chicken Burger",
      "quantity": 2,
      "price": 45
    },
    {
      "name": "Taho",
      "quantity": 1,
      "price": 15
    }
  ],
  "totalAmount": 105
}
```
</details>

<details>
<summary>Check order status</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/chatbot/order-status/ORD-20251120-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20251120-001",
    "status": "preparing",
    "totalAmount": 105,
    "createdAt": "2025-11-20T10:30:00.000Z",
    "estimatedTime": "10 minutes"
  }
}
```
</details>

<details>
<summary>Debug menu items</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/chatbot/debug/menu-items
```

**Response:**
```json
{
  "success": true,
  "menuItems": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Chicken Burger",
      "price": 45,
      "available": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Taho",
      "price": 15,
      "available": true
    }
  ]
}
```
</details>

---

### 💳 Payments (`/payments`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/` | Create a new payment | Private |
| `GET` | `/` | Get all payments | Staff Only |
| `GET` | `/my-payments` | Get logged-in user's payments | Private |
| `GET` | `/:id` | Get single payment by ID | Private |
| `PATCH` | `/:id/status` | Update payment status | Staff Only |
| `POST` | `/webhook/gcash` | Process GCash payment webhook | Public (GCash server) |

**Examples:**

<details>
<summary>Create a new payment</summary>

```bash
curl -X POST https://g09-backend.onrender.com/api/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "507f1f77bcf86cd799439020",
    "amount": 105,
    "paymentMethod": "gcash"
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439030",
    "order": "507f1f77bcf86cd799439020",
    "user": "507f1f77bcf86cd799439011",
    "amount": 105,
    "paymentMethod": "gcash",
    "status": "pending",
    "transactionId": "GCASH-20251120-001",
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```
</details>

<details>
<summary>Get my payments</summary>

```bash
curl -X GET https://g09-backend.onrender.com/api/payments/my-payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "order": {
        "orderNumber": "ORD-20251120-001",
        "totalAmount": 105
      },
      "amount": 105,
      "paymentMethod": "gcash",
      "status": "completed",
      "transactionId": "GCASH-20251120-001",
      "createdAt": "2025-11-20T10:30:00.000Z"
    }
  ]
}
```
</details>

<details>
<summary>Update payment status (Staff only)</summary>

```bash
curl -X PATCH https://g09-backend.onrender.com/api/payments/507f1f77bcf86cd799439030/status \
  -H "Authorization: Bearer STAFF_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439030",
    "status": "completed",
    "updatedAt": "2025-11-20T10:35:00.000Z"
  }
}
```
</details>

---

## 🔌 Real-time Events (Socket.io)

The backend uses Socket.io for real-time updates. Connect to the server and emit/listen to the following events:

### Client → Server Events
- **`authenticate`**: Authenticate user connection
  - Send: `userId`
- **`joinOrderRoom`**: Join a specific order room for updates
  - Send: `orderId`
- **`joinStaffRoom`**: Join staff room to receive all order notifications (Staff only)
- **`updateOrderStatus`**: Update an order's status (Staff only)
  - Send: `{ orderId, status, userId }`
- **`newOrder`**: Notify staff about a new order
  - Send: `order` object

### Server → Client Events

**For Canteen Staff (Room: `staff_room`):**
- **`newOrderNotification`**: Triggered when a customer places a new order
  - Payload: `{ orderId, orderNumber, customerName, totalAmount, status, createdAt }`
- **`staffOrderUpdate`**: Triggered when an order status is updated
  - Payload: `{ orderId, status, updatedBy, updatedAt }`

**For Customers (Room: `order_{orderId}`):**
- **`orderStatusUpdated`**: Triggered when their order status changes
  - Payload: `{ orderId, status, updatedAt }`

**Error Events:**
- **`error`**: Sent when an error occurs
  - Payload: `{ message }`

---

## 📂 Project Structure

```
G09-Backend/
├── bru/                # Bruno API testing collection
├── controllers/        # Business logic for each route (auth, user, menu, order, chatbot, payment)
├── middleware/         # Auth middleware and error handling
├── models/             # Mongoose schemas (User, Menu, Order, Payment)
├── routes/             # API route definitions (auth, user, menu, order, chatbot, payment)
├── .env                # Environment variables (not in git)
├── index.js            # App entry point and server configuration
├── socket.js           # Socket.io real-time communication setup
└── package.json        # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.