# SportsAmigo

A full-stack sports event management system with role-based access for Organizers, Players, and Managers.


## Technologies Used

### Frontend
- **React** 19.2.0 - UI library
- **React Router DOM** 6.28.2 - Client-side routing
- **Redux Toolkit** 2.11.0 - State management
- **Redux Persist** - Persist Redux state
- **Axios** - HTTP client for API requests
- **Create React App** - Build tooling

### Backend
- **Node.js** with **Express.js** 4.18.2 - Server framework
- **MongoDB** with **Mongoose** 8.0.0 - Database
- **bcrypt** 5.1.1 - Password hashing
- **express-session** - Session management
- **connect-mongo** - MongoDB session store
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Resend** - Email notifications

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### 1. Clone the repository
```bash
git clone <repository-url>
cd SportsAmigo
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory (use `.env.example` as reference):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sportsamigo
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

Start the backend server:
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the React development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

### 4. Optional: Seed Data

```bash
cd backend
npm run seed:shop     # Seed shop items
npm run seed:wallet   # Seed wallet data
```

## One-Command Local Demo (Docker)

Use Docker Compose to run MongoDB, Redis, backend, and frontend together:

```bash
docker compose up --build
```

Then open:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/health`

Stop all services:

```bash
docker compose down
```

## Project Structure

```
SportsAmigo/
├── backend/
│   ├── config/           # Configuration files (MongoDB, etc.)
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models and schemas
│   ├── routes/           # Express routes
│   │   ├── auth.js       # Authentication routes
│   │   ├── player.js     # Player-specific routes
│   │   ├── manager.js    # Manager-specific routes
│   │   └── organizer.js  # Organizer-specific routes
│   ├── utils/            # Utility functions
│   ├── public/           # Static files and uploads
│   ├── server.js         # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── public/           # Public assets
│   ├── src/
│   │   ├── assets/       # Images, fonts, static assets
│   │   ├── components/   # Reusable React components
│   │   │   ├── layout/   # Layout components
│   │   │   └── common/   # Common UI components
│   │   ├── pages/        # Page components
│   │   │   ├── player/   # Player dashboard pages
│   │   │   ├── manager/  # Manager dashboard pages
│   │   │   └── organizer/# Organizer dashboard pages
│   │   ├── store/        # Redux store and slices
│   │   ├── services/     # API service functions
│   │   ├── hooks/        # Custom React hooks
│   │   ├── contexts/     # React context providers
│   │   ├── styles/       # Global styles
│   │   ├── utils/        # Utility functions
│   │   ├── App.js        # Root component
│   │   └── index.js      # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

- **Authentication**: `/api/auth/*`
- **Player Routes**: `/api/player/*`
- **Manager Routes**: `/api/manager/*`
- **Organizer Routes**: `/api/organizer/*`

## Database

The application uses MongoDB for data storage. Collections include:
- `users` - User accounts and authentication
- `teams` - Sports teams
- `events` - Sports events
- `matches` - Match records
- `registrations` - Team/player registrations
- `sessions` - User sessions

## License

ISC 