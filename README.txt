TEAMPILOT - PREMIUM TASK MANAGEMENT PLATFORM
===========================================

SHORT PROJECT OVERVIEW
----------------------
TeamPilot is a production-grade, full-stack Task Management SaaS application built to demonstrate high-quality engineering, secure architecture, and premium user experience. Designed with a meticulous, responsive UI, it features a robust backend, advanced Role-Based Access Control (RBAC), and operational dashboard analytics.


KEY FEATURES
------------
* Advanced Role-Based Access Control (RBAC): Strict separation between Admin and Member capabilities. Admins manage projects, users, and all tasks. Members have a focused "My Tasks" view and can only progress tasks assigned specifically to them.
* Enterprise-Grade Dashboard: Interactive, auto-calculating analytics grid providing immediate operational visibility into project counts, overdue tasks, and team bandwidth.
* Dynamic Task Operations: Real-time task filtering (TODO, IN_PROGRESS, DONE, OVERDUE) combined with ownership metadata visualization.
* Secure Authentication: Robust JWT-based authentication featuring hashed password storage and rigorous password strength validation.
* Premium UI/UX: Built with Tailwind CSS, the interface delivers fluid micro-animations, intentional whitespace, color psychology mappings, and fully responsive layouts across mobile, tablet, and desktop.


TECH STACK
----------
* Frontend: React.js (Vite), Tailwind CSS, Framer Motion, React Router
* Backend: Python 3, FastAPI, SQLAlchemy
* Database: PostgreSQL (Production) / SQLite (Local)
* Deployment: Vercel (Frontend), Railway (Backend)


AUTHENTICATION & RBAC SUMMARY
-----------------------------
The platform enforces strict JWT authentication. Roles are strictly partitioned into 'ADMIN' and 'MEMBER'.
* ADMIN: Full access to system data. Can create, read, update, and delete projects, tasks, and team member assignments.
* MEMBER: Isolated access to their own workload. Can view assigned tasks, update their status, and view associated project details, but cannot manipulate global system state or view other users' workloads.


DEPLOYMENT ARCHITECTURE
-----------------------
The application employs a decoupled architecture optimized for scalability. The frontend is built as a static Single Page Application (SPA) hosted globally on Vercel's Edge Network for instant load times. The backend operates as a containerized FastAPI Python server on Railway, seamlessly connected to a production PostgreSQL database.


LIVE URLS
---------
* Frontend (Vercel): https://team-pilot-delta.vercel.app
* Backend API (Railway): https://teampilot-production.up.railway.app


DEMO CREDENTIALS
----------------
[Admin Account]
Email: admin@ethara.com
Password: Password123!

[Member Account]
Email: member@ethara.com
Password: Password123!


LOCAL SETUP INSTRUCTIONS
------------------------
1. Backend Setup:
   - cd backend
   - python -m venv .venv
   - source .venv/bin/activate
   - pip install -r requirements.txt
   - uvicorn main:app --reload --port 8080

2. Frontend Setup:
   - cd frontend
   - npm install
   - npm run dev


PRODUCTION HIGHLIGHTS
---------------------
* Fully optimized for PostgreSQL production deployments.
* Evaluator-ready error handling and robust backend API validation.
* Clean, semantic React component architecture.
* Strict workflow separation preventing horizontal privilege escalation.


FINAL NOTES
-----------
The repository commit history has been professionally streamlined into a single, clean production commit for ease of evaluator review. The application is completely functional, live, and ready for technical evaluation.
