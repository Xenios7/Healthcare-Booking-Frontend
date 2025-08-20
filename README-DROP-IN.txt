Drop-in instructions (existing Vite project):
1) Backup your current `src/`:
   mv src src.backup.$(date +%s)

2) Unzip this archive and copy the included `src/` folder into your project root:
   cp -r src your-project/

3) Install deps (inside your project):
   npm i react-router-dom

4) (Optional) Tailwind already configured? If not, skip; this code uses basic classes that work even without Tailwind.

5) Copy `.env.example` to `.env` and tweak:
   cp .env.example .env
   # adjust VITE_API_BASE_URL if your backend differs

6) Start dev server:
   npm run dev

Inside the app, log in with your API credentials. The code expects:
- POST /api/users/login -> { token: "..." }
- GET  /api/users/me -> user profile including roles e.g. ["ROLE_PATIENT"]

Update `src/services/api.js` if your endpoints differ.
