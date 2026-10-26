# FaceID Attendance System

Employee attendance and HR web app with **face check-in**, built as my graduation thesis at Van Lang University (2025) for a fictional company, *IT-Global*.

> Team of 2. I was team leader and full-stack developer (NestJS API, React admin, Python face service, deployment).

## Features

- **FaceID check-in / check-out:** webcam capture → liveness (anti-spoofing) check → face-embedding match against the employee's registered faces
- On-time / late status with late minutes, based on the employee's shift; duplicate check-in protection
- GPS coordinates and IP recorded with every check-in
- Shifts and shift assignment per employee
- 5 request types with approval: leave, overtime, late/early, remote work, shift change
- Salary calculation, dashboard and PDF/Excel reports
- Users, roles and permissions (JWT auth), departments, companies, system logs, email notifications

## Architecture

```
React admin (Vite)  ──REST──▶  NestJS API  ──▶  MongoDB
                                   │
                                   └──HTTPS──▶  Python face service (Flask)
                                               liveness check · embeddings · matching
```

| Part | Stack | Folder |
|---|---|---|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, Ant Design, react-webcam, face-api.js, ApexCharts, jsPDF, xlsx | `frontend/` |
| Backend | NestJS 11, TypeScript, MongoDB (Mongoose), Passport JWT, Swagger, @nestjs/schedule, Nodemailer | `backend/` |
| Face service | Python 3.11, Flask, face_recognition, OpenCV, PyTorch | `face-service/` |

The NestJS API has 19 feature modules: auth, users, roles, permissions, companies, departments, jobs, shifts, user-shifts, attendance, face-recognition, requests, salary, reports, dashboard, mail, files, system-configs, system-logs.

## Run locally

Requirements: Node.js 18+, Python 3.11, MongoDB, CMake (needed by `face_recognition`), and [mkcert](https://github.com/FiloSottile/mkcert) for local HTTPS (browsers only allow webcam and GPS over HTTPS or on localhost).

```bash
# 1. Face service
cd face-service
git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing silent_face_anti_spoofing   # liveness models (Apache-2.0)
python -m venv venv && source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
mkdir SSL && mkcert -cert-file SSL/localhost+1.pem -key-file SSL/localhost+1-key.pem localhost 127.0.0.1
python main.py                                          # https://localhost:9000

# 2. Backend
cd backend
cp .env.example .env        # fill in MongoDB URL, JWT secrets, face-service URL, mail settings
npm install
npm run dev                 # Swagger docs at /api/docs

# 3. Frontend
cd frontend
cp .env.example .env.development
npm install
npm run dev
```

## What I learned

- Splitting the AI part into a separate service kept the NestJS API simple and let the face model be changed independently.
- Liveness detection matters: a plain face match can be fooled by a photo on a phone screen.
- Handling camera, HTTPS, GPS and errors across three services end to end.

## Credits

- The backend and admin UI started from the **Hỏi Dân IT** NestJS/React course starter (auth, users, roles, permissions, companies, jobs). Attendance, face recognition, shifts, requests, salary, reports, dashboard and the Python service were built for this thesis.
- Liveness detection uses [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) by Minivision (Apache-2.0); it is not vendored in this repo.
- Face detection in the browser uses [face-api.js](https://github.com/justadudewhohacks/face-api.js) (MIT) models in `frontend/public/models`.

This repo is a clean copy for portfolio purposes: real employee photos, environment files and certificates from the original project are not included.

## Author

**Nguyễn Tất Hiển** — [LinkedIn](https://linkedin.com/in/nguyentathien/) · tathien2003@gmail.com
