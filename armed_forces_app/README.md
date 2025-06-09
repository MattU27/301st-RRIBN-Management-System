# Armed Forces Personnel Management App

A Flutter application for managing Armed Forces personnel records, trainings, and announcements.

## Features

- User authentication and authorization
- Personnel management
- Training records and scheduling
- Announcements and notifications
- Document management
- Policy access

## Deployment on Render

This application is configured for deployment on Render.com. The mobile app can be deployed as a web app that connects to the same MongoDB database as your existing web application.

### Prerequisites

1. A Render.com account
2. Access to your MongoDB Atlas cluster
3. Git repository with your code

### Deployment Steps

1. **Fork or push your code to a Git repository**

   Make sure your code is available in a Git repository that Render can access.

2. **Create a new Web Service on Render**

   - Log in to your Render dashboard
   - Click "New" and select "Web Service"
   - Connect your Git repository
   - Use the following settings:
     - **Name**: armed-forces-app
     - **Environment**: Static Site
     - **Build Command**: `./build.sh`
     - **Publish Directory**: `public`

3. **Set Environment Variables**

   Add the following environment variables in the Render dashboard:
   
   - `MONGODB_URI`: `mongodb+srv://MattU:Jm22152927-%40@cluster0.wt06z4x.mongodb.net/afp_personnel_db?retryWrites=true&w=majority&appName=Cluster0`
   - `API_URL`: Your API service URL (if you have a separate API service)

4. **Deploy**

   Click "Create Web Service" and Render will automatically build and deploy your application.

5. **Access Your App**

   Once the deployment is complete, you can access your app at the URL provided by Render.

## Local Development

### Prerequisites

- Flutter SDK (3.6.2 or later)
- Dart SDK
- MongoDB instance (local or remote)

### Setup

1. Clone the repository
```
git clone <repository-url>
cd armed_forces_app
```

2. Install dependencies
```
flutter pub get
```

3. Run the app
```
flutter run -d chrome  # For web
flutter run             # For mobile
```

## Configuration

The app is configured to use different MongoDB connection strings based on the environment:

- Development: Local MongoDB instance
- Production: MongoDB Atlas cluster

The connection settings can be found in `lib/core/config/mongodb_config.dart`.
