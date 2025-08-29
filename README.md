# Healthcare Booking App
End-to-end medical appointments platform: patients book visits, doctors manage availability, admins oversee operations.

## Live demo
- **Web:** https://medicalbooking.koyeb.app/
- **API:** https://medicalbooking-api.koyeb.app/  (Swagger at `/swagger-ui`)

> Region: Frankfurt (eu-central-1) • Platform: Koyeb  
> Services: `healthcare-booking-frontend`, `healthcare-booking-api` • DB: Postgres v17

---

## Quick start (local)
```bash
# 1) Copy environment
cp .env.example .env

# 2) Start the stack
docker compose up -d

# 3) Open:
# Web → http://localhost:3000
# API → http://localhost:8080  (Swagger at /swagger-ui)
