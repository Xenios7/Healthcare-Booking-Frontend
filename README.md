# Medical Booking – Frontend (React + Vite)

A lightweight **React + Vite** frontend for the Medical Booking system.  
The **backend (Spring Boot API)** lives here → https://github.com/Xenios7/bookingapi

---

## 🌐 Live & Docs
- **Live app:** https://medicalbooking.koyeb.app
- **Backend Swagger UI:** https://medicalbooking-api.koyeb.app/swagger-ui.html
- **Demo video:** https://youtu.be/CqW8P-5wNE0

> Most screenshots, architecture notes, and longer docs are centralized in the backend repo to keep this README short.

---

## ⚙️ Quick Start

```bash
# 1) Clone
git clone <your-frontend-repo-url>
cd <your-frontend-repo-folder>

# 2) Environment
cp .env.example .env
# then set VITE_API_URL to your API (cloud or local)

# 3) Install deps
npm install

# 4) Run dev server
npm run dev
```

### .env example
```dotenv
# API base URL (choose one)
VITE_API_URL=https://medicalbooking-api.koyeb.app
# VITE_API_URL=http://localhost:8080
```

> If you run the API locally, ensure backend CORS allows your dev origin (e.g., http://localhost:5173).

---

## 🧱 Project Structure (frontend)

```
.
├─ public/
│  └─ index.html
└─ src/
   ├─ auth/           # auth-related components/hooks
   ├─ components/     # shared UI
   ├─ hooks/          # custom hooks
   ├─ pages/          # Login, Dashboards, Booking
   ├─ services/       # API calls (uses VITE_API_URL)
   ├─ App.jsx
   ├─ main.jsx
   └─ styles.css
```

---

## 🔑 Auth (JWT)
- Sends `Authorization: Bearer <token>` with API calls.
- Role-based UI for **Patient / Doctor / Admin** matches backend rules.

---

## 🧪 Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # production build
npm run preview  # preview the production build locally
```

---

## 🧩 Local dev proxy (optional)

If you prefer not to change CORS on the API during local dev, you can proxy API paths in `vite.config.js`:

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api':  { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      '/auth': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
    },
  },
};
```

---

## 📸 Screenshots
For the full gallery, see the backend README: https://github.com/Xenios7/bookingapi

---

## 📜 License
MIT – see [LICENSE](LICENSE).
