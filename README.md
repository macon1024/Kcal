# Kcal - Calorie Tracker

A full-stack calorie tracking application with Web and Mobile interfaces.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB
- **Web**: React, Vite
- **Mobile**: React Native, Expo

## Prerequisites
- Node.js installed
- MongoDB installed and running (default: `mongodb://localhost:27017/kcal`)

## Getting Started

### 1. Backend
The backend serves the API for both web and mobile apps.

```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:5000`.

### 2. Web App
The web dashboard.

```bash
cd web
npm install
npm run dev
```
Access at `http://localhost:5173` (or port shown in terminal).

### 3. Mobile App
The mobile application (Android/iOS).

```bash
cd mobile
npm install
npx expo start
```
- Scan the QR code with Expo Go app on your phone.
- Or press `a` for Android Emulator, `i` for iOS Simulator.

**Note for Mobile**:
If running on a physical device, update `API_URL` in `mobile/app/(tabs)/index.tsx` and `mobile/app/(tabs)/add-food.tsx` to your computer's IP address (e.g., `http://192.168.1.5:5000/api`).
For Android Emulator, `http://10.0.2.2:5000/api` is pre-configured.

## Features
- **Dashboard**: View daily calorie intake and logged meals.
- **Add Food**: Create new food items and log meals (Breakfast, Lunch, Dinner, Snack).
