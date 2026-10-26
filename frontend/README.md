# IT-Global — Attendance Admin & Check-in (React)

Web front end for the **FaceID Attendance System** (graduation thesis, 2025): employee check-in with webcam, plus an admin area for employees, shifts, requests, salary and reports.

## Stack

React 18 · TypeScript · Vite · Redux Toolkit · React Router · Ant Design 5 + Pro Components · react-webcam · face-api.js · ApexCharts · jsPDF · xlsx · SASS

## Features

- Webcam check-in / check-out with GPS (browser geolocation)
- Admin: employees, roles & permissions, departments, shifts and assignments
- Request approval (leave, overtime, late/early, remote work, shift change)
- Dashboard charts and PDF / Excel export of attendance and salary reports

## Run

```bash
cp .env.example .env.development   # VITE_BACKEND_URL=...
npm install
npm run dev
# production: npm run build && npm run preview
```

> Webcam and GPS only work over HTTPS or on localhost.

Author: **Nguyễn Tất Hiển**
