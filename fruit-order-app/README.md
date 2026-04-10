# 🍋 FreshMarket – Daily Fruit Ordering App

A lightweight web application for daily fruit ordering. Admin sets rates each morning, users log in and place orders, admin downloads a consolidated report and resets for the next day.

---

## Features

- **User registration & login** (phone + password)
- **Admin panel** — set daily fruit rates, manage fruit list
- **User ordering** — see today's rates, enter quantities, place/update order
- **Admin reports** — per-user orders + consolidated totals per fruit
- **CSV download + one-click reset** — export data then clear for next day
- **No unnecessary data stored** — orders are deleted after admin downloads

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (Pages Router) |
| Auth | NextAuth.js (JWT, credentials) |
| Database | Vercel Postgres |
| Hosting | Vercel (free tier) |
| Styling | Custom CSS (no UI library needed) |

---

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create your environment file
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate one
- `NEXTAUTH_URL` — set to `http://localhost:3000`
- Postgres vars — see below

### 3. Set up a database (for local dev)

**Option A: Vercel Postgres (recommended)**
- Push your repo to GitHub
- Create a project on [vercel.com](https://vercel.com)
- Go to **Storage → Create Database → Postgres**
- Click `.env.local` tab and copy all the values into your local `.env.local`

**Option B: Local Postgres**
- Install Postgres locally
- Create a database: `createdb freshmarket`
- Set `POSTGRES_URL="postgresql://localhost/freshmarket"`

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Initialize the database
Visit: `http://localhost:3000/api/admin/setup`

This will:
- Create all 4 tables
- Create a default admin account
- Add 7 default fruits

**Default admin login:**
- Phone: `0000000000`
- Password: `admin123`

> ⚠️ Change the admin password immediately after first login (or add a change-password page).

---

## Deploying to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/fruit-order-app.git
git push -u origin main
```

### Step 2: Import on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click **Deploy** (it will fail the first time — that's okay, we need to add env vars)

### Step 3: Add Vercel Postgres
1. In your Vercel project → **Storage** tab → **Create Database** → **Postgres**
2. Name it anything (e.g. `freshmarket-db`)
3. Click **Connect** — Vercel automatically adds all `POSTGRES_*` env vars to your project

### Step 4: Add remaining env vars
In Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste the output |
| `NEXTAUTH_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |

### Step 5: Redeploy
Go to **Deployments** → click the three dots on the latest → **Redeploy**

### Step 6: Initialize the database
Visit: `https://your-app.vercel.app/api/admin/setup`

You'll see:
```json
{ "success": true, "message": "Database initialized. Default admin: phone=0000000000, password=admin123" }
```

---

## Daily Workflow

```
Morning
  └─ Admin logs in
  └─ Goes to Dashboard
  └─ Sets today's rate for each fruit
  └─ Saves rates

Throughout the day
  └─ Users log in
  └─ See today's fruits + rates
  └─ Enter quantities and place order
  └─ Can update order any time

End of day
  └─ Admin views consolidated totals
  └─ Clicks "Download & Reset"
      → CSV file downloads to computer
      → All orders for today are deleted
      → Ready for tomorrow
```

---

## Database Tables

```sql
users        — id, name, phone, password_hash, role, created_at
fruits       — id, name, unit, active
daily_rates  — id, fruit_id, price, rate_date   (upserted each day)
orders       — id, user_id, fruit_id, quantity, order_date  (cleared daily)
```

Only `orders` gets cleared. Everything else is permanent.

---

## Adding More Admin Accounts

Currently you can only create user accounts via the registration page. To make someone an admin, run this SQL in your Vercel Postgres console:

```sql
UPDATE users SET role = 'admin' WHERE phone = 'their_phone_number';
```

---

## Customization

- **App name**: Search for `FreshMarket` in the code and replace with your brand name
- **Currency**: Search for `₹` and replace with your currency symbol
- **Default fruits**: Edit the `defaultFruits` array in `/pages/api/admin/setup.ts`
- **Units**: Add more options in `/pages/admin/fruits.tsx` in the `<select>` element

---

## Project Structure

```
fruit-order-app/
├── pages/
│   ├── index.tsx              # Redirects to login or dashboard
│   ├── login.tsx              # Login page
│   ├── register.tsx           # User registration
│   ├── dashboard.tsx          # User order page
│   ├── admin/
│   │   ├── index.tsx          # Admin dashboard (rates + orders)
│   │   └── fruits.tsx         # Manage fruit list
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth].ts   # Auth handler
│       │   └── register.ts        # User registration API
│       ├── admin/
│       │   ├── setup.ts       # DB init
│       │   ├── fruits.ts      # CRUD fruits
│       │   ├── rates.ts       # Set/get daily rates
│       │   └── orders.ts      # View/reset orders
│       └── user/
│           └── orders.ts      # Place/view orders
├── components/
│   └── Navbar.tsx
├── lib/
│   └── db.ts                  # DB connection + queries
├── styles/
│   └── globals.css
├── types/
│   └── next-auth.d.ts
├── .env.example
├── next.config.js
├── tsconfig.json
└── package.json
```
