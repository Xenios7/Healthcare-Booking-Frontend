# Medical Booking — Frontend (Vite + React)

A tiny React UI to demo your Spring Boot booking API.

## Quick start

```bash
npm install
npm run dev
```

Then open the printed URL (default: http://localhost:5173).

## Configure endpoints

Copy `.env.example` to `.env` and adjust if your backend paths differ:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_LOGIN_PATH=/auth/login
VITE_APPOINTMENTS_PATH=/api/appointments
VITE_ADMIN_PATH=/api/admin/users
```

The app expects your login endpoint to return a JWT, either as plain text or JSON:
- `{ "token": "xxx.yyy.zzz" }` or `{ "jwt": "..."}` ...
- or just the token string body.
