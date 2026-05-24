# Satyajit Ray Film & Television Institute (SRFTI) - Grievance Redressal Portal

An advanced, full-stack, bilingual (English/Hindi), and accessibility-compliant (WCAG 2.1 AA) Grievance Redressal Portal designed specifically for university operations at the **Satyajit Ray Film & Television Institute (SRFTI)**.

This portal is containerized with **Docker** and connects a **React (Vite) Frontend** to a **Node.js/Express API Backend** and a **MySQL 8.0 Database**.

---

## Key Features

1. **Strict Registration Limits**: Registration is restricted strictly to official university emails ending in `@srfti.ac.in` or its subdomains (e.g. `@student.srfti.ac.in`).
2. **Three Registered Complainant Types**: Users register under three distinct sectors:
   - **Student** (SLA Timeline: 22 Days, Appellate: **Ombudsman / Lokpal**)
   - **Teaching Faculty** (SLA Timeline: 15 Days, Appellate: Dean of Academic Affairs)
   - **Non-Teaching Staff** (SLA Timeline: 30 Days, Appellate: Registrar)
3. **Role-Based Workspaces**: Scoped dashboard systems for Complainants, Nodal Officers (one for each sector), Appellate Authorities, and the Administrator.
4. **SLA Timeline Tracking**: Visual step-timeline graphics, countdown metrics, and urgent warning notifications for Nodal Officers for complaints approaching or breaching their resolution limits.
5. **Interactive MIS Management Reports**: The admin panel houses clean, custom-coded SVG/HTML charts analyzing case allocations, average speeds, category divisions, and sector rates.
6. **Bilingual Localization Engine**: Fully localized across English and Hindi. Toggle seamlessly at any point.
7. **Bypass Simulation Mode**: If MySQL or Docker is offline, the React frontend features a **Developer Simulation Portal** to pre-seed sessions instantly for quick local previews and evaluations.
8. **Bespoke Accessibility Controls**:
   - Skips-to-Content anchor links for keyboard users.
   - Text size custom scale adjustments (`A-`, `A`, `A+`) using custom HSL calculations.
   - Accessible Ultra High-Contrast Dark mode.
   - Semantic ARIA roles and labels on all inputs.

---

## Seed Accounts (Quick Review Logins)

The database automatically seeds the following credentials on the first launch of the Express backend. Alternatively, you can use the **Developer Simulation Panel** at the bottom of the login page to enter these dashboards in 1-click:

| Sector / Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@srfti.ac.in` | `admin123` | Can edit timelines, register officials, view MIS reports. |
| **Student Nodal Officer** | `student_nodal@srfti.ac.in` | `nodal123` | Resolves student issues, tracks SLA timers. |
| **Ombudsman (Lokpal)** | `ombudsman@srfti.ac.in` | `appellate123` | Handles escalated student appeals. |
| **Registered Student** | `rahul@student.srfti.ac.in` | `student123` | Submits, tracks, and appeals student grievances. |
| **Faculty Nodal Officer** | `faculty_nodal@srfti.ac.in` | `nodal123` | Resolves faculty grievances. |
| **Dean (Academic Appellate)** | `dean@srfti.ac.in` | `appellate123` | Handles faculty appeals. |
| **Staff Nodal Officer** | `staff_nodal@srfti.ac.in` | `nodal123` | Resolves staff grievances. |
| **Registrar (Staff Appellate)** | `registrar@srfti.ac.in` | `appellate123` | Handles staff appeals. |

---

## Docker Compose Quickstart

Ensure you have **Docker Desktop** installed and running on your system.

1. Navigate to the project root:
   ```powershell
   cd C:\Users\Somaditya\.gemini\antigravity\scratch\srfti-grievance-app
   ```
2. Build and launch the multi-container stack:
   ```powershell
   docker compose up --build
   ```
3. Open your browser and navigate to:
   - **Frontend Application**: [http://localhost:5173](http://localhost:5173)
   - **Backend API Server**: [http://localhost:5000/api/settings](http://localhost:5000/api/settings)
   - **MySQL Database**: Exposed locally on port `3306` (username: `root`, password: `srfti_password`).

---

## Local Development (Without Docker)

If you prefer to run the services individually:

### 1. Database Configuration
Run the queries inside `server/schema.sql` inside a local MySQL server. Update credentials in `server/db.js` or create a `.env` inside `server/` containing:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=srfti_grievance
```

### 2. Backend Server Setup
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Client Setup
```bash
cd client
npm install
npm run dev
```
Explore the portal on `http://localhost:5173`.
