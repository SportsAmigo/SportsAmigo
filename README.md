# Sports Event Management System

A web application for managing sports events with different user roles: Organizer, Player, and Manager.

## Features

- **User Authentication**:
  - Role-based login and registration (Organizer, Player, Manager)
  - Secure password storage with bcrypt
  - Session management

- **Role-Specific Dashboards**:
  - **Organizer**: Create and manage sports events
  - **Player**: Join events and manage participation
  - **Manager**: Manage teams and players

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templates, Bootstrap 5
- **Database**: SQLite3
- **Authentication**: bcrypt, express-session

## Setup and Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

4. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Project Structure

- `/views`: EJS templates
  - `/views/organizer`: Organizer-specific templates
  - `/views/player`: Player-specific templates
  - `/views/manager`: Manager-specific templates
- `/routes`: Express routes
- `/database`: Database configuration and models
- `/public`: Static assets
  - `/public/css`: CSS files
  - `/public/js`: JavaScript files
- `/controllers`: Route controllers (future implementation)

## Database

The application uses SQLite for data storage. The database file (`users.db`) is automatically created in the `/database` directory when the application is first run.

## License

ISC 