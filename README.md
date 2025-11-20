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

Base URL: `http://localhost:5000/api`

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/register` | Register a new user (Student/Faculty/Staff) | Public |
| `POST` | `/login` | Login and receive JWT token | Public |
| `GET` | `/logout` | Logout user | Private |

### 👤 Users (`/users`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `GET` | `/current-user` | Get current logged-in user details | Private |
| `PATCH` | `/update-user` | Update user profile | Private |
| `PATCH` | `/update-password` | Change user password | Private |

### 🍔 Menu (`/menu`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `GET` | `/` | Get all available menu items | Public |
| `POST` | `/` | Add a new menu item | Staff Only |
| `PATCH` | `/:id` | Update a menu item | Staff Only |
| `DELETE` | `/:id` | Delete a menu item | Staff Only |

### 📦 Orders (`/orders`)
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/` | Create a new order | Student/Faculty |
| `GET` | `/` | Get all orders (with filters) | Staff Only |
| `GET` | `/my-orders` | Get current user's order history | Private |
| `GET` | `/:id` | Get specific order details | Owner/Staff |
| `PATCH` | `/:id/status` | Update order status (pending -> preparing -> ready) | Staff Only |
| `DELETE` | `/:id` | Cancel an order | Owner/Staff |

### 🤖 AI Chatbot (`/chatbot`)
The chatbot uses NLP to understand user intents.
| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/process-order` | Send a message to the bot (e.g., "I want a burger") | Private |
| `GET` | `/order-status/:orderNumber` | Check status of a specific order | Private |

**Chatbot Capabilities:**
- **Ordering**: "I want 2 burgers and a coke"
- **Price Check**: "How much is the spaghetti?"
- **Menu Inquiry**: "What do you have?"
- **Order Status**: "Check my order status"

---

## 🔌 Real-time Events (Socket.io)

The backend emits events to keep the frontend in sync.

### For Canteen Staff (Room: `staff_room`)
- **`newOrder`**: Triggered when a customer places a new order.
  - Payload: `{ orderId, orderNumber, status, totalAmount, items }`
- **`orderPrepared`**: Triggered when an order is marked as 'prepared'.

### For Customers (Room: `order_{orderId}`)
- **`orderStatusUpdated`**: Triggered when the status of their order changes.
  - Payload: `{ orderId, status, updatedAt }`
- **`orderCancelled`**: Triggered when their order is cancelled.

---

## 📂 Project Structure

```
G09-Backend/
├── config/             # Database and app configuration
├── controllers/        # Business logic for each route
├── middleware/         # Auth, error handling, and validation
├── models/             # Mongoose schemas (User, Menu, Order)
├── routes/             # API route definitions
├── utils/              # Helper functions
├── index.js            # App entry point
├── socket.js           # Socket.io configuration
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