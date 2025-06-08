# Deploying the 301st RRIBN Mobile App on Render

This guide explains how to deploy the Flutter mobile app to Render as a web application.

## Overview

The mobile app is built with Flutter and can be deployed as a web application on Render. This allows users to access the mobile app through a web browser, which is useful for testing and accessibility.

## Prerequisites

- A Render account (https://render.com)
- Git repository with your code pushed to GitHub, GitLab, or another supported Git provider
- The Flutter app should be configured to use the correct API endpoints (already done in `app_constants.dart`)

## Deployment Steps

1. **Log in to Render**
   - Go to https://dashboard.render.com and sign in to your account

2. **Create a New Web Service**
   - Click on "New" and select "Web Service"
   - Connect your Git repository
   - Select the repository containing your project

3. **Configure the Web Service**
   - **Name**: `301st-rribn-mobile-app` (or your preferred name)
   - **Environment**: `Static Site`
   - **Build Command**: `bash ./flutter-build.sh`
   - **Publish Directory**: `./armed_forces_app/build/web`
   - **Environment Variables**:
     - Add `FLUTTER_BASE_HREF` with value `/`

4. **Advanced Settings**
   - Add a route rule:
     - **Source Path**: `/*`
     - **Destination Path**: `/index.html`
     - This enables client-side routing for Flutter web

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building and deploying your Flutter web app

## Monitoring Deployment

- You can monitor the build process in the Render dashboard
- The initial build may take several minutes as Flutter is installed and the web app is built
- Once deployed, Render will provide a URL to access your Flutter web app

## Troubleshooting

- **Build Failures**: Check the build logs in Render for specific errors
- **API Connection Issues**: Ensure the `baseUrl` in `app_constants.dart` matches your deployed backend URL
- **Routing Issues**: Make sure the route rewrite rule is correctly configured

## Updating the App

To update your app:
1. Push changes to your Git repository
2. Render will automatically rebuild and deploy the updated app

## Accessing Your App

Once deployed, your Flutter web app will be available at:
`https://301st-rribn-mobile-app.onrender.com` (or a similar URL based on your service name)

## Note on Mobile vs Web

While this deploys your Flutter app as a web application, it's important to note:
- Some native mobile features may not work in the web environment
- The UI might need adjustments for optimal web viewing
- For true mobile deployment, you'll still need to build and publish native Android/iOS apps through their respective stores 