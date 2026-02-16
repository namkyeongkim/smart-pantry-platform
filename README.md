# Pantry App - Team Setup

## 🚀 Quick Start (Running the App)

### 1. Prerequisites
- **Node.js** installed on your machine.
- **Expo Go** app on your phone.

### 2. Frontend Setup (Verified Working)
The backend is currently hosted by Sam via **ngrok**, so you don't need to run it locally!

1.  Navigate to `mobile/`:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npx expo start
    ```
4.  Scan the QR code with your phone. 
    - The app is pre-configured to connect to the stable backend at: `https://supercommercial-suellen-lacelike.ngrok-free.dev`.

---

## 🛠️ Backend Setup (Optional - For Sam Only)
If you need to run the backend yourself:
1.  `cd backend`
2.  `npm install`
3.  Configure `.env` (Ask Sam for `SPOONACULAR_API_KEY`).
4.  `node server.js`

## we will be moving this over to a cloud server so i will not need to be online for this to work. 