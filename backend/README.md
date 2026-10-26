# IT-Global — Attendance & HR API (NestJS)

REST API for the **FaceID Attendance System** (graduation thesis, 2025). Handles authentication, employees, shifts, face check-in, requests, salary and reports, and calls a separate Python service for face recognition.

## Stack

NestJS 11 · TypeScript · MongoDB (Mongoose) · Passport JWT · Swagger · @nestjs/schedule · @nestjs/throttler · Nodemailer (Handlebars templates) · bcrypt

## Modules

| Area | Modules |
|---|---|
| Auth & access | auth, users, roles, permissions |
| Organisation | companies, departments, jobs |
| Attendance | shifts, user-shifts, attendance, face-recognition |
| HR | requests (leave, overtime, late/early, remote, shift change), salary |
| Insight | dashboard, reports, system-logs |
| Platform | mail, files, system-configs |

### Check-in flow

1. Receive webcam image + GPS from the client
2. Python service: liveness (anti-spoofing) check → face embedding
3. Compare with the employee's stored face descriptors
4. Find today's shift, block duplicate check-ins, compute on-time / late minutes
5. Save the record with image, GPS and IP

## Run

```bash
cp .env.example .env   # MONGO_URL, JWT secrets, PORT, face-service URL, mail settings
npm install
npm run dev            # Swagger docs at /api/docs
```

Part of the [FaceID Attendance System](../README.md) · see also `frontend/` and `face-service/`

Author: **Nguyễn Tất Hiển**
