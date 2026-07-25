# Job & Internship Tracker

A full-stack web app to track job and internship applications through the hiring pipeline — from "Applied" to "Offer" (or "Rejected").

Built to solve a real problem: keeping every application, its status, and follow-up notes in one place instead of a scattered spreadsheet.

## Features

- Add, edit, and delete applications (company, role, status, date applied, job link, notes)
- Track status through a pipeline: Applied → OA/Test → Interview → Offer / Rejected
- Filter by status and search by company or role
- Live dashboard stats (total applications + count per status)
- Fully responsive UI (works on mobile)
- REST API backend with persistent SQLite storage

## Tech Stack

- **Backend:** Node.js, Express, `node:sqlite` (Node's built-in SQLite module — no native compilation, so `npm install` works on Windows/Mac/Linux without any build tools)
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API, no framework overhead)
- **API:** RESTful endpoints (GET / POST / PUT / DELETE)

> **Requires Node.js v22.5.0 or later** (v24 recommended). Check your version with `node -v`.

## Project Structure

```
job-tracker/
├── server.js       # Express app + REST API routes
├── db.js           # SQLite database setup
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser at:
   ```
   http://localhost:3000
   ```

That's it — no separate database setup needed. A `job_tracker.db` SQLite file is created automatically on first run.

## API Endpoints

| Method | Endpoint                | Description                          |
|--------|--------------------------|---------------------------------------|
| GET    | `/api/applications`      | List all applications (supports `?status=` and `?search=`) |
| GET    | `/api/applications/:id`  | Get a single application              |
| POST   | `/api/applications`      | Create a new application              |
| PUT    | `/api/applications/:id`  | Update an application                 |
| DELETE | `/api/applications/:id`  | Delete an application                 |
| GET    | `/api/stats`             | Summary counts by status              |

## Possible Future Improvements

- User authentication (multi-user support)
- Email/browser reminders for follow-ups
- Export data to CSV
- Deploy live demo (Render/Railway for backend, or a single combined deployment)

## Author

Priyanka Priyadarshini Satapathy
