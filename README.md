   
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

## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/G09-Backend.git](https://github.com/yourusername/G09-Backend.git)
   cd G09-Backend