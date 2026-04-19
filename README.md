# Recipe-Driven Pantry Management System

A smart pantry tracking system that updates inventory based on cooking habits rather than manual entry.

## Features
- **Dietary Profiles**: Set permanent restrictions (Vegan, GF, Allergies).
- **Smart Recommendations**: Find recipes based on cravings + current inventory.
- **Auto-Deduction**: Cooking a meal automatically updates pantry stock.
- **Analytics**: Track recipe popularity, monitor pantry usage, and identify low-stock items.
- **Admin Dashboard**: Monitor users, recipe activity, pantry inventory, and system-wide analytics through a web interface.

## Tech Stack
- **Frontend (Native Mobile)**: React Native (Expo)
- **Frontend (Web Admin Dashboard)**: React (Vite)
- **Backend**: Node.js / Express
- **Database**: PostgreSQL (Neon)

## Getting Started

### Prerequisites
- Node.js (v18+)

### Project Structure
- `mobile/`: Frontend native mobile app (Expo React Native)
- `admin-dashboard/`: Web-based admin dashboard (React + Vite)
- `backend/`: Backend Node/Express API
- `database/`: Database scripts

### Setup Instructions

#### 1. Database
The project uses [Neon](https://neon.tech) serverless PostgreSQL. Set your `DATABASE_URL` in `backend/.env`.

If setting up a new database, run the SQL in `database/init.sql` against your Neon instance.

#### 2. Backend (Server)
1. Navigate to the server directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file if needed (see `db.js` for defaults).
4. Start the server:
   - Development: `npm run dev`
   - Production: `npm start`
5. **Exposing the Backend (ngrok)**:
   - To connect your physical phone or admin dashboard remotely to the backend, use `ngrok`:
     ```bash
     ngrok http 3000
     ```
   - Copy the `https` URL provided by ngrok (e.g., `https://random-id.ngrok-free.app`).

#### 3. Mobile App (Native)
The native app is in `mobile/` and includes login/register, pantry management, and recipe screens.

1. Navigate to the mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Create `.env` from `.env.example` and set `EXPO_PUBLIC_API_URL`:
   - Set it to your **ngrok URL** (e.g., `EXPO_PUBLIC_API_URL=https://random-id.ngrok-free.app`)
4. **Starting the App with Tunnel**:
   - Run the following command to start Expo with a tunnel (bypasses local network restrictions):
     ```bash
     npx expo start --tunnel
     ```
5. **Scan and View**:
   - Install the **Expo Go** app on your physical phone (iOS/Android).
   - Use your phone's camera (iOS) or the Expo Go scan feature (Android) to scan the **QR Code** displayed in your terminal.
   - The app will load on your phone and connect to your backend via the ngrok tunnel.

#### 4. Admin Dashboard (Web)
The admin dashboard is in `admin-dashboard/` and provides a web interface for monitoring system activity and analytics.

**Included Dashboard Features**
- View total users, recipes, pantry items, and favorites
- Track popular recipes
- Monitor low-stock pantry items
- View user activity and pantry overview
- Access analytics charts through a separate admin page

1. Navigate to the admin dashboard directory: `cd admin-dashboard`
2. Install dependencies: `npm install`
3. Create a `.env` file and set `VITE_API_URL`:
   - For local backend:
     ```env
     VITE_API_URL=http://localhost:3000
     ```
   - Or use your **ngrok URL**:
     ```env
     VITE_API_URL=https://random-id.ngrok-free.app
     ```
4. Start the admin dashboard:
   ```bash
   npm run dev
   ```
5. Open in your browser:
   http://localhost:5173

