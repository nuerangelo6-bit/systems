# ASSCAT Grievance Report System

Student Grievance Report System — Advanced Database Management System for ASSCAT BSIT 2B

## 🚀 Quick Start

### 1. Database Setup
- Open XAMPP → Start Apache + MySQL
- Open phpMyAdmin → SQL tab
- Copy and run the contents of `student_grievance_db.sql`

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

---

## 🔑 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | super123 |
| Hearing Officer | admin | admin123 |
| Hearing Officer 2 | officer2 | officer123 |
| Student | Register via app | — |

---

## 👥 Roles & Features

### 👑 Super Admin
- Full dashboard with all stats
- Assign hearing officers to cases
- View all cases, hearings, summons
- SQL query runner for custom reports
- Manage all system data

### ⚖️ Hearing Officer (Admin)
- Dashboard of all cases
- Schedule hearings (auto-issues summons to both parties)
- Reschedule hearings with reason
- Mark hearings complete with outcome
- Update case status
- Print summon letters
- View case history and logs

### 🎓 Student
- Register account
- File grievance with suspect picker (BSIT 2B classnames)
- View own cases + status
- See summon notifications
- Track by case number (GRV-2026-XXXX)
- Print summon letters

---

## 🗄️ Database Schema

- `users` — students, admins, superadmin
- `categories` — grievance types (Academic, Harassment, Bullying, etc.)
- `suspects` — BSIT 2B classmates (41 names seeded)
- `grievances` — main table with case_number, suspect, status
- `hearings` — scheduled hearings with reschedule support
- `summons` — issued notices to complainant + respondent
- `grievance_logs` — full audit trail
- `grievance_attachments` — file attachments for evidence

### Stored Procedures
- `sp_submit_grievance` — creates grievance + auto case number
- `sp_update_status` — updates + logs status
- `sp_schedule_hearing` — schedules hearing + auto-issues summons

### Triggers
- `trg_set_resolution_date` — sets date when resolved/closed
- `trg_log_status_change` — logs every status change

### View
- `vw_grievance_summary` — joined view for all grievance data

---

## 📋 Case Workflow

1. **Submission** - Student files grievance with details and suspect
2. **Auto-Assignment** - Case number generated (GRV-YYYY-XXXX)
3. **Review** - Admin reviews the case
4. **Assignment** - Super admin assigns hearing officer
5. **Hearing Scheduled** - Admin schedules hearing date/time/venue
6. **Summons Issued** - Both parties receive notification
7. **Hearing** - Scheduled hearing takes place
8. **Resolution** - Case resolved or closed
9. **Tracking** - Students can track case progress via case number

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- MySQL with MariaDB
- JWT Authentication
- Multer for file uploads

**Frontend:**
- React 18
- Vite
- React Router
- Axios
- React Icons

---

## 📁 Project Structure

```
ASSCAT GRIEVANCE REPORT SYSTEM/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── middleware/
│   │   └── auth.js              # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js              # Login/Register
│   │   ├── grievances.js        # Grievance CRUD
│   │   ├── hearings.js         # Hearing management
│   │   └── data.js              # Categories, suspects, stats
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── utils/               # Helper functions
│   │   └── styles/              # CSS styles
│   ├── package.json
│   └── vite.config.js
└── student_grievance_db.sql    # Database schema
```

---

## 🔐 Security Notes

- Passwords are stored as plain text (demo only - use bcrypt in production)
- JWT tokens expire after 24 hours
- SQL injection protection via parameterized queries
- Role-based access control on all endpoints

---

## 📝 Improvements Made

This rebuilt system includes:
- Complete backend API with Express.js
- JWT-based authentication
- Role-based access control
- Stored procedures for complex operations
- Automatic summons generation
- Case tracking system
- Full audit trail via grievance_logs
- Hearing scheduling with reschedule support
- Print-ready summon letters

---

Built with React + Vite (frontend) · Express + MySQL (backend)
