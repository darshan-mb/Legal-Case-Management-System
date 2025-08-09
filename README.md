# Legal Case Management System

A comprehensive web application for managing legal cases, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### For Advocates
- Case Management (Add, Update, View cases)
- Document Management (Upload and manage case-related documents)
- Calendar & Scheduling (Track and manage hearing dates)

### For Clients
- View case details using case number
- Access case-related documents
- View upcoming hearing schedules

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd legal-case-management
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/legalcase
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

## Running the Application

1. Start MongoDB server:
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm start
```

3. Open the frontend:
- Navigate to the `frontend` directory
- Open `index.html` in a web browser
- Or use a local development server like `live-server`

## Usage

### Registration
1. Click on "Register" link
2. Fill in the required details
3. Select role (Advocate/Client)
4. Submit the form

### Login
1. Enter username and password
2. Select role
3. Click "Login"

### Advocate Dashboard
- Navigate between Case Management, Document Management, and Calendar using the navigation buttons
- Add new cases using the "Add New Case" button
- Upload documents by selecting a case and filling the document form
- View and update hearing dates in the Calendar section

### Client Dashboard
- Enter case number to view case details
- Access case documents
- View upcoming hearing schedules

## Security Features

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Protected API endpoints

## Project Structure

```
legal-case-management/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Case.js
│   │   └── Document.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cases.js
│   │   ├── documents.js
│   │   └── calendar.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── styles/
    │   └── main.css
    └── js/
        ├── api.js
        ├── auth.js
        └── dashboard.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 