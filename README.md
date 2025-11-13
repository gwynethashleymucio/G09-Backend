   
## 🔧 File Descriptions

### 1. [index.js](cci:7://file:///c:/Users/justi/G09-Backend/index.js:0:0-0:0)
**Purpose**: Main application entry point that ties everything together.

**Key Components**:
- Express server setup
- Middleware configuration
- Route registration
- Error handling
- Database connection
- Server startup

### 2. `config/db.js`
**Purpose**: Database configuration and connection setup.

**Key Features**:
- MongoDB connection using Mongoose
- Connection error handling
- Environment-based configuration

### 3. `controllers/`

#### `auth.controller.js`
**Purpose**: Handles authentication logic.

**Key Functions**:
- [register](cci:1://file:///c:/Users/justi/G09-Backend/controllers/auth.js:11:0-49:2): Creates new user accounts
- [login](cci:1://file:///c:/Users/justi/G09-Backend/controllers/auth.js:51:0-89:2): Authenticates users and issues JWT tokens

#### `user.controller.js`
**Purpose**: Manages user-related operations.

**Key Functions**:
- [getUserProfile](cci:1://file:///c:/Users/justi/G09-Backend/controllers/user.js:4:0-17:2): Gets current user's profile
- [updateUserProfile](cci:1://file:///c:/Users/justi/G09-Backend/controllers/user.js:19:0-43:2): Updates user information
- [deleteUserAccount](cci:1://file:///c:/Users/justi/G09-Backend/controllers/user.js:45:0-60:2): Handles account deletion

### 4. `models/user.model.js`
**Purpose**: Defines the User schema and model.

**Key Fields**:
- `firstName`, `lastName`, `email`, `password`
- `role` (user/admin)
- `createdAt`, `updatedAt` timestamps

**Features**:
- Password hashing
- Input validation
- Indexes for performance

### 5. `routes/`

#### `auth.routes.js`
**Endpoints**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

#### `user.routes.js`
**Endpoints**:
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `DELETE /api/users/me` - Delete account

### 6. `middlewares/`

#### `auth.middleware.js`
**Purpose**: Protects routes and validates JWT tokens.

**Key Features**:
- Token verification
- Role-based access control
- Error handling

### 7. `utils/`

#### `appError.js`
**Purpose**: Custom error class for consistent error handling.

#### `catchAsync.js`
**Purpose**: Wrapper for async/await error handling.

## 🚀 API Documentation

### Authentication

| Method | Endpoint | Description | Authentication | Request Body |
|--------|----------|-------------|----------------|--------------|
| POST   | `/api/auth/register` | Register a new user | None | `{ firstName, lastName, email, password, userType }` |
| POST   | `/api/auth/login` | User login | None | `{ email, password }` |

### Users
*All user routes require authentication*

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET    | `/api/users/me` | Get current user's profile | All |
| PUT    | `/api/users/me` | Update current user's profile | All |
| DELETE | `/api/users/me` | Delete current user's account | All |

### Menu

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET    | `/api/menu` | Get all menu items | Public |
| POST   | `/api/menu` | Add new menu item | Canteen Staff |

### Orders

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST   | `/api/orders` | Create new order | Student, Faculty |
| GET    | `/api/orders` | Get all orders | Canteen Staff |
| GET    | `/api/orders/my-orders` | Get current user's orders | All |
| GET    | `/api/orders/:id` | Get order by ID | Owner or Staff |
| PATCH  | `/api/orders/:id/status` | Update order status | Canteen Staff |
| GET    | `/api/orders/:id/history` | Get order history | Owner or Staff |
| DELETE | `/api/orders/:id` | Cancel order | Owner |

### Chatbot
*All chatbot routes require authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/chatbot/process-order` | Process natural language order |
| GET    | `/api/chatbot/order-status/:orderNumber` | Get order status |
| GET    | `/api/chatbot/debug/menu-items` | Debug endpoint for menu items |

## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/G09-Backend.git
   cd G09-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=90d
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 🔐 Authentication

Include the JWT token in the `Authorization` header for protected routes:
```
Authorization: Bearer your.jwt.token.here
```

## 📝 Notes

- All dates are returned in ISO 8601 format (UTC)
- Error responses follow the format: `{ success: false, message: 'Error message' }`
- Successful responses include a `success: true` flag
- Pagination is available on list endpoints using `page` and `limit` query parameters

## 🏗️ Project Structure

```
G09-Backend/
├── controllers/     # Route controllers
├── models/         # Database models
├── routes/         # Route definitions
├── middleware/     # Custom middleware
├── config/         # Configuration files
└── utils/          # Utility functions