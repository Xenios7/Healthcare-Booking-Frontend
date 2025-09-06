# Medical Booking – Frontend (React + Vite)

A lightweight **React + Vite** frontend for the Medical Booking system.  
The **backend (Spring Boot API)** lives here → https://github.com/Xenios7/Healthcare-Booking-Api

---

## 🌐 Live & Docs
- **Live app:** https://medicalbooking.koyeb.app
- **Backend Swagger UI:** https://medicalbooking-api.koyeb.app/swagger-ui.html
- **Demo video:** https://youtu.be/CqW8P-5wNE0

> Most screenshots, architecture notes, and longer docs are centralized in the backend repo to keep this README short.

---

## 🧱 Project Structure (frontend)


```
.
├─ src/
│  ├─ auth/                      # Auth-related components/hooks
│  ├─ components/                # Shared/reusable UI components
│  ├─ hooks/                     # Custom React hooks
│  ├─ pages/                     # Page-level views (Login, Dashboard, Booking)
│  ├─ services/                  # API integration (e.g. axios/fetch)
│  ├─ App.jsx                    # Root app component
│  ├─ main.jsx                   # React entry point
│  └─ styles.css                 # Global styles
│
├─ index.html                    # HTML entry point
├─ .env / .env.example           # Env variables
├─ .env.production               # Production config
├─ package.json                  # Dependencies & scripts
├─ vite.config.js                # Vite config
└─ README.md
```

---

## 🔑 Auth (JWT)
- Sends `Authorization: Bearer <token>` with API calls.
- Role-based UI for **Patient / Doctor / Admin** matches backend rules.

---

## 📜 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

