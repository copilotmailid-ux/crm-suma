# Placement Cell CRM - Admin Panel

A modern, responsive admin dashboard to manage student records, placement records, company details, and alumni data.

## Tech Stack

- **Frontend:** React (Vite), React Router, Recharts, Axios
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Auth:** JWT (JSON Web Tokens)
- **Export:** Excel (xlsx), PDF (jspdf + jspdf-autotable)

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally (MongoDB Compass compatible)

### 1. Start the Backend

```bash
cd server
npm install
npm run dev
```

The server will start on `http://localhost:5000`.  
On first run, a default admin is seeded:
- **Email:** `admin@placementcell.com`
- **Password:** `Admin@123`

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

The client will start on `http://localhost:5173`.

## Features

- 📊 **Dashboard Analytics** — Stats cards, dept/company/batch charts, recent placements
- 👨‍🎓 **Student Management** — Add, edit, view, delete, search, filter by dept/batch/status
- 🏢 **Company Management** — Full CRUD with industry filter and contact details
- 🎯 **Placement Recording** — Link students to companies, auto-update status & create alumni
- 🎓 **Alumni Tracking** — Auto-generated from placements, editable current details & LinkedIn
- 📥 **Export** — Download Excel & PDF for any data table
- 🔐 **JWT Authentication** — Secure admin-only access
- 🌙 **Dark Theme** — Premium glassmorphism UI with smooth animations
