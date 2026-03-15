# Kcal Deployment Guide

This guide will walk you through deploying the Kcal backend, web app, and mobile app.

## 1. Backend (Render)

Render is a cloud platform that offers a free tier for hosting Node.js services.

1.  **Create a GitHub Repository**:
    - Push your `Kcal` project to a new private GitHub repository.
    - Make sure `backend`, `web`, and `mobile` folders are in the root.

2.  **Sign up for Render**: Go to [https://render.com](https://render.com) and sign up/login with GitHub.

3.  **Create a Web Service**:
    - Click **"New"** -> **"Web Service"**.
    - Connect your GitHub repository.
    - **Name**: `kcal-backend`
    - **Root Directory**: `backend`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
    - **Plan**: Free

4.  **Environment Variables**:
    - Scroll down to "Environment Variables" and add:
        - `PORT`: `10000` (Render's default)
        - `JWT_SECRET`: (Generate a long random string)
        - `FRONTEND_URL`: (We will update this *after* deploying the web app)
        - `EMAIL_USER`: (Your Gmail address)
        - `EMAIL_PASS`: (Your Google App Password)
    - *Note: Since we switched to NeDB (file-based DB), the data will be reset every time the server restarts on the free tier. For persistent data, you would normally use MongoDB Atlas.*
    - *Important: If you see "EMERGENCY-LINK" or email errors, check that `EMAIL_USER` and `EMAIL_PASS` are correct.*

5.  **Deploy**: Click "Create Web Service". Wait for it to finish. Copy the URL (e.g., `https://kcal-backend.onrender.com`).

---

## 2. Web App (Render Static Site)

1.  **Create a Static Site**:
    - On Render dashboard, click **"New"** -> **"Static Site"**.
    - Connect the same GitHub repository.
    - **Name**: `kcal-web`
    - **Root Directory**: `web`
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist`

4.  **Environment Variables**:
    - Scroll down to "Environment Variables" and add:
        - `VITE_API_URL`: Your backend URL + `/api` (e.g., `https://kcal-backend.onrender.com/api`)
    - *Important: You must set this BEFORE the first deployment, or redeploy after setting it.*

5.  **Deploy**: Click "Create Static Site". Wait for it to finish. Copy the URL (e.g., `https://kcal-web.onrender.com`).

4.  **Update Configuration**:
    - Go back to your **Backend Service** on Render.
    - Update `FRONTEND_URL` to your new Web App URL (`https://kcal-web.onrender.com`).
    - **Redeploy** the backend.

---

## 3. Mobile App (Expo EAS)

Expo Application Services (EAS) allows you to build the app in the cloud.

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```

2.  **Login to Expo**:
    ```bash
    eas login
    ```

3.  **Configure Project**:
    ```bash
    cd mobile
    eas build:configure
    ```

4.  **Update API URL**:
    - Before building, you must update `mobile/constants/api.ts` to point to your **deployed backend URL** (e.g., `https://kcal-backend.onrender.com/api`).
    - *Do not use localhost!*

5.  **Build for Android (APK)**:
    ```bash
    eas build -p android --profile preview
    ```
    - This will generate a downloadable `.apk` file you can install on your phone.

6.  **Build for iOS**:
    - Requires an Apple Developer Account ($99/year) for TestFlight/App Store.
    - For testing without paying, use the **Expo Go** app and just run `npx expo start` on your computer (tunnel mode).

---

## 4. Final Verification

1.  Open your **Web App URL**.
2.  Register a new account.
3.  Check if the verification email arrives (it should contain the correct deployed link).
4.  Log in and add some food!
