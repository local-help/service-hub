# LocalHelp — Local Services Booking & Coordination Platform

LocalHelp connects customers with verified local service providers through a central customer-care and admin coordination team.

## Architecture

- **Backend:** Ruby on Rails 8 (API mode) + PostgreSQL 16 + Solid Queue
- **Web App & Admin Dashboard:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Mobile App:** React Native + Expo SDK 52 (Single codebase for Android & iOS)
- **Authentication:** Stateless JWT access tokens + DB-backed refresh tokens + Mobile OTP verification
- **Communication:** Configurable Phone (`tel:`) dialer & WhatsApp click-to-chat (`wa.me`) with prefilled request templates referencing `LH-XXXXX`

---

## Quickstart

### 1. Database (Docker Compose)
```bash
docker-compose up -d db
```

### 2. Backend (Rails 8 API)
```bash
cd backend
bundle install
bundle exec rails db:migrate
bundle exec rails db:seed
bundle exec rails server -p 3000
```

### 3. Web Application & Admin Dashboard (Next.js 15)
```bash
cd web
npm install
npm run dev
# Accessible at http://localhost:3000 (proxies /api to backend)
```

To run a production build:
```bash
cd web
npm run build
npm start -- -p 3001
```

### 4. Customer Mobile Application (React Native / Expo)
```bash
cd mobile
npm install
npx expo start
```

### 5. Run Automated Tests
```bash
cd backend
bundle exec rspec
# 41 examples, 0 failures
```

---

## Seed Accounts

| Role | Email | Phone | Password |
|------|-------|-------|----------|
| **Super Admin** | `superadmin@localhelp.com` | `+919999900001` | `Admin@123456` |
| **Admin** | `admin@localhelp.com` | `+919999900002` | `Admin@123456` |
| **Customer** | `customer@example.com` | `+919888877771` | `Customer@123456` |

---

## Documentation
- [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) — Progress tracking and phase checklists
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) — REST API specifications and example payloads
