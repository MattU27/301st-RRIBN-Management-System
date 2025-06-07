# Deploying to Render

This guide provides instructions on how to deploy the 301st-RRIBN-Management-System to Render, even while development is still in progress.

## Web Application Deployment

### Prerequisites
- A Render account (sign up at [render.com](https://render.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Steps to Deploy Web Application

1. **Log in to Render**
   - Go to [dashboard.render.com](https://dashboard.render.com) and sign in

2. **Create a New Web Service**
   - Click on "New +" and select "Web Service"
   - Connect your Git repository
   - Select the repository containing your Next.js application

3. **Configure the Web Service**
   - **Name**: `301st-rribn-management-system` (or your preferred name)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: For development, "Free" tier is sufficient (upgrade later)

4. **Environment Variables**
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB connection string (see Database section below)
     - Add any other secrets or API keys your application needs

5. **Auto-Deploy Settings**
   - Enable "Auto-Deploy" for your main branch
   - This will automatically deploy changes when you push to the repository

6. **Create the Web Service**
   - Click "Create Web Service"
   - Render will build and deploy your application (this may take a few minutes)

## Database Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas Account**
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free tier cluster

2. **Configure Database Access**
   - Create a database user with a secure password
   - Configure network access (IP whitelist)
     - Add `0.0.0.0/0` temporarily for development (restrict later)

3. **Get Connection String**
   - Go to "Connect" > "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Add this as `MONGODB_URI` environment variable in Render

### Option 2: Render MongoDB (Alternative)

1. **Create a MongoDB Database**
   - In Render dashboard, click "New +" and select "PostgreSQL" or "Redis"
     - (Note: Render doesn't directly offer MongoDB, but you can use PostgreSQL with an adapter)

2. **Connect Your Database**
   - Copy the "Internal Connection String"
   - Add as `DATABASE_URL` environment variable to your Web Service

## Mobile Application Setup

For the Flutter mobile app, you'll need to:

1. **Update API Endpoints**
   - Modify `armed_forces_app/lib/core/constants/app_constants.dart` 
   - Update `productionUrl` to point to your Render deployed backend:
     ```dart
     static const String productionUrl = 'https://your-render-app-name.onrender.com';
     ```

2. **Build the App for Testing**
   - Run `flutter build apk --debug` to create a debug APK for testing with the production backend

## Important Considerations for Incomplete Projects

1. **Feature Flags**
   - Implement feature flags to disable incomplete functionality in production
   - Add a config file that can toggle features on/off

2. **Database Seeding**
   - Create scripts to seed essential data in your production database
   - Run `npm run seed:personnel` and other seed scripts as needed

3. **Error Handling**
   - Ensure robust error handling for features still in development
   - Add proper fallbacks for unimplemented features

4. **Environment-Specific Configuration**
   - Use different configuration for development vs. production
   - Example in Next.js config or environment variables

5. **Blockchain Integration (Future)**
   - Deploy core application now
   - Add Hyperledger Fabric integration later when ready
   - Use abstraction layers to make the integration seamless when completed

## Monitoring and Debugging

1. **Enable Render Logs**
   - View real-time logs in the Render dashboard
   - Useful for debugging deployment and runtime issues

2. **Add Monitoring**
   - Set up health checks to monitor your application status
   - Implement logging to track application behavior

## Updating Your Deployment

With Auto-Deploy enabled, simply push changes to your repository to update your application. Render will automatically rebuild and deploy the latest version.

For major updates or database schema changes, consider:
1. Creating a staging environment first
2. Testing thoroughly before deploying to production
3. Using database migrations for schema changes

## Secure Early Access

If you want to limit access during development:
1. Add basic authentication to your application
2. Implement an invite-only system
3. Use Render's password protection feature

This will allow selected users to test the application while keeping it private from general public access. 