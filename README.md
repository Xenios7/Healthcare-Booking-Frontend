# 🏥 Healthcare Booking App
End-to-end medical appointments platform — patients book visits, doctors manage availability, admins oversee operations.

---

## 🚀 Live Demo
- **Web:** https://medicalbooking.koyeb.app/
- **API:** https://medicalbooking-api.koyeb.app/  → Swagger at `/swagger-ui`

> **Platform:** Koyeb • **Region:** Frankfurt (eu-central-1) • **Services:** `healthcare-booking-frontend`, `healthcare-booking-api` • **DB:** Postgres v17 (`ep-cold-scene-a2ffs6hj.eu-central-1.pg.koyeb.app`)

---

## ⚡ Quick Start (Local)
```bash
# 1) Copy environment
cp .env.example .env

# 2) Start everything
docker compose up -d

# 3) Open:
# Web → http://localhost:3000
# API → http://localhost:8080  (Swagger at /swagger-ui)

🔑 Environment Variables

Create .env from .env.example and adjust as needed:

# Database
POSTGRES_DB=app
POSTGRES_USER=app
POSTGRES_PASSWORD=app

# Backend (Spring Boot)
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/app
SPRING_DATASOURCE_USERNAME=app
SPRING_DATASOURCE_PASSWORD=app
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=change-me-please

✨ Features

📅 Appointment booking flow (create, confirm, cancel)

👥 Role-based access (patient / doctor / admin)

🗓️ Doctor availability & calendar view

🔐 JWT authentication

📜 OpenAPI/Swagger documentation

🐳 One-command local run (Docker Compose)

🧰 Tech Stack

Backend: Spring Boot, PostgreSQL, JWT

Frontend: React/Next.js (consumes API_URL)

Infra: Docker Compose; Koyeb for production

🧷 Repositories

API: https://github.com/Xenios7/Healthcare-Booking-Api

Web: https://github.com/Xenios7/Healthcare-Booking-Frontend

Looking for implementation details? See each repo’s README. This hub is the product page + one-command run.

🎥 Demo Video

Place your video under docs/ and it will appear here.

High quality (download / preview): docs/demo.mov

Best browser compatibility: convert a copy to MP4 → docs/demo.mp4

<!-- Inline player (works best with .mp4); GitHub may still render as a link --> <video src="docs/demo.mp4" controls width="720"> Your browser does not support the video tag. <a href="docs/demo.mp4">Download the demo video</a>. </video>
📸 Screenshots

Put images in docs/screens/ (use any filenames). A few examples:

<p align="center"> <img src="docs/screens/landing.png" alt="Landing" width="900" /> <br/> <img src="docs/screens/booking.png" alt="Booking flow" width="900" /> <br/> <img src="docs/screens/calendar.png" alt="Doctor calendar" width="900" /> <br/> <img src="docs/screens/admin.png" alt="Admin dashboard" width="900" /> </p>

💡 Tip: Keep images ~1200px wide for crisp rendering. PNG for UI, SVG/PNG for diagrams.

🧠 Architecture

Export your diagram to docs/architecture.png.

Flow: Web (Next.js) → API (Spring Boot) → PostgreSQL
Auth: JWT (role-based endpoints)
Deploy: Koyeb (Frankfurt, eu-central-1)

🗄️ Database
🧩 ERD

Export to docs/erd.png:

# Frontend
API_URL=http://localhost:8080

📚 API Docs

Local Swagger UI: http://localhost:8080/swagger-ui

OpenAPI JSON: http://localhost:8080/v3/api-docs

Prod Swagger: https://medicalbooking-api.koyeb.app/swagger-ui

☁️ Deployment
Koyeb (Production)

Web: healthcare-booking-frontend → https://medicalbooking.koyeb.app/

Env: API_URL=https://medicalbooking-api.koyeb.app

API: healthcare-booking-api → https://medicalbooking-api.koyeb.app/

Env: DB URL/creds, SPRING_PROFILES_ACTIVE=prod, JWT_SECRET=…

Database: Postgres v17 → ep-cold-scene-a2ffs6hj.eu-central-1.pg.koyeb.app

Docker (Local)

docker compose up -d brings up Web, API, DB.

Ports: Web 3000, API 8080, Postgres 5432.
