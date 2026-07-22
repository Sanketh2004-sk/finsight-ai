# AiXpense — AI-Powered Expense Management Platform

AiXpense is a production-quality, intelligent financial management application. It offers AI-driven features like receipt scanning, voice expense entry, a spending coach chat, and dynamic budgeting tools to keep your financial life organized.

## Features

- **Auth System:** JWT-based authentication with secure password hashing.
- **Finance Tracking:** CRUD operations for Incomes, Expenses, Budgets, and Goals.
- **AI Services:**
  - Receipt Parsing via Gemini Vision
  - Voice Entry via Sarvam AI
  - AI Financial Coach & Spending Predictions via OpenAI
- **Analytics & Reporting:** Interactive charts (Chart.js) and downloadable monthly PDF reports.
- **Notifications:** Background jobs (Cron) alert you to subscription renewals, recurring expenses, and budget overruns.
- **Responsive UI:** Modern glassmorphism design with React, Vite, and Tailwind CSS v4.

## Tech Stack

### Frontend
- React 18, Vite
- Tailwind CSS v4 (No PostCSS required)
- Axios (with interceptors)
- React Router DOM
- Chart.js (react-chartjs-2)
- React Icons

### Backend
- Node.js, Express.js
- MongoDB (Mongoose)
- JWT, bcrypt, helmet, express-rate-limit
- Node-Cron (Background jobs)
- Multer & Cloudinary (Image handling)
- Nodemailer (Emails and Reports)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB account (Atlas or local)
- API Keys: OpenAI, Gemini API, Sarvam API, Cloudinary.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aixpense.git
   cd aixpense
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your environment variables in .env
   npm run dev
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

### Docker

You can run the entire application using Docker Compose:

```bash
docker-compose up --build
```
This will start the Node server on port 5000 and the React app on port 80.

## Environment Variables

### Backend (`server/.env`)
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
SARVAM_API_KEY=your_sarvam_api_key

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_password
FROM_EMAIL=noreply@aixpense.com
```

## Testing

Backend tests are written with **Jest** and **Supertest**.
```bash
cd server
npm test
```

## Security & Architecture

- **MVC Pattern**: Backend is divided into Routes, Controllers, Models, and Middlewares.
- **Security Hardening**: Utilizes `helmet` for secure HTTP headers, `cors` for cross-origin management, and `express-rate-limit` to prevent brute force attacks. Input validation exists on all major endpoints.
- **Error Handling**: Centralized error middleware ensures sensitive info doesn't leak into production stack traces.

## CI/CD

A GitHub Actions workflow is included (`.github/workflows/ci.yml`) to automatically install dependencies and run backend tests on pushes to the main branch.

## License

This project is licensed under the MIT License.
