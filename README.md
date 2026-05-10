# TeamPilot - Premium Task Management Platform

TeamPilot is a production-grade, full-stack Task Management SaaS application built to demonstrate high-quality engineering, secure architecture, and premium user experience. Designed with a meticulous glassmorphism UI, it features a robust backend, advanced Role-Based Access Control (RBAC), and operational dashboard analytics.

## 🚀 Live Demo

- **Frontend Application:** [https://team-pilot-delta.vercel.app](https://team-pilot-delta.vercel.app)
- **Backend API:** [https://teampilot-production.up.railway.app](https://teampilot-production.up.railway.app)

## ✨ Features

- **Advanced Role-Based Access Control (RBAC):** Strict separation between `Admin` and `Member` capabilities. Admins manage projects, users, and all tasks. Members have a focused "My Tasks" view and can only progress tasks assigned specifically to them.
- **Enterprise-Grade Dashboard:** Interactive, auto-calculating analytics grid providing immediate operational visibility into project counts, overdue tasks, and team bandwidth.
- **Dynamic Task Operations:** Real-time task filtering (`TODO`, `IN_PROGRESS`, `DONE`, `OVERDUE`) combined with ownership metadata visualization.
- **Secure Authentication:** Robust JWT-based authentication featuring hashed password storage and rigorous password strength validation.
- **Premium UI/UX:** Built with Tailwind CSS and Framer Motion, the interface delivers fluid micro-animations, intentional whitespace, color psychology mappings, and fully responsive layouts across mobile, tablet, and desktop.

## 🛠 Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Styling & Responsive Design)
- **Framer Motion** (Micro-animations & transitions)
- **React Router** (Client-side routing)
- **Lucide React** (Iconography)

### Backend
- **Python 3 / FastAPI** (High-performance API framework)
- **SQLAlchemy** (ORM for Database Management)
- **SQLite / PostgreSQL** (Database layer configured for seamless cloud transition)
- **Passlib & Python-Jose** (Security & JWT token generation)

## 🏗 Architecture & RBAC

TeamPilot operates on a two-tier Role-Based Access Control system:

1. **System Admin (`ADMIN`):**
   - Full CRUD access to Projects, Tasks, and Users.
   - Can view the entire organizational dashboard.
   - Can reassign, edit, and delete any task.
   - Cannot accidentally progress a task unless explicitly assigned to them.
   
2. **Team Member (`MEMBER`):**
   - Restricted to "My Tasks" and "Projects" views.
   - Can only view tasks assigned to them or their associated projects.
   - Can progress task states (`TODO` -> `IN_PROGRESS` -> `DONE`) only if they are the designated assignee.

## 🗂 Folder Structure

```text
ethara/
├── backend/
│   ├── main.py          # FastAPI application & route controllers
│   ├── models.py        # SQLAlchemy database models
│   ├── schemas.py       # Pydantic validation schemas
│   ├── crud.py          # Database queries & transactions
│   ├── auth.py          # JWT authentication & security logic
│   ├── database.py      # Database connection & session management
│   ├── Procfile         # Railway/Heroku deployment configuration
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (Modals, StatCards)
│   │   ├── pages/       # Core application views (Dashboard, Tasks)
│   │   ├── context/     # React Context for Auth & Notifications
│   │   ├── utils/       # API configuration and Axios interceptors
│   │   ├── styles/      # Global CSS and Tailwind directives
│   │   ├── App.jsx      # Routing configuration
│   │   └── main.jsx     # Application entry point
│   ├── tailwind.config.js
│   └── vercel.json      # Vercel deployment configuration for SPA routing
├── .gitignore
└── README.md
```

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ethara.git
cd ethara
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🔐 Environment Variables

Ensure you set the following environment variables when deploying to production:

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=https://your-production-api.com/api
```

## 🚢 Deployment Instructions

This repository is optimized for modern PaaS providers.

**Frontend (Vercel):**
1. Connect the repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Vercel will automatically detect Vite and apply the `vercel.json` rewrite rules.

**Backend (Railway / Render):**
1. Connect the repository to Railway/Render.
2. Set the Root Directory to `backend`.
3. Add the `DATABASE_URL` environment variable.
4. The provided `Procfile` and `requirements.txt` will automatically boot the FastAPI server.

## 🧪 Demo Credentials

To test the RBAC capabilities, use the following default local credentials:

**Admin User:**
- Email: `admin@ethara.com`
- Password: `Password123!`

**Member User:**
- Email: `member@ethara.com`
- Password: `Password123!`

---
*Built to demonstrate full-stack engineering excellence, secure architecture, and premium user experience.*
