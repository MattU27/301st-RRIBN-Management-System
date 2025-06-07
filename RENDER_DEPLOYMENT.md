# Deploying to Render

This guide will walk you through the process of deploying your 301st-RRIBN-Management-System to Render.com.

## Prerequisites

1. A [Render account](https://render.com)
2. Your code pushed to a GitHub, GitLab, or Bitbucket repository
3. A MongoDB database (either MongoDB Atlas or another provider)

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (the free tier is sufficient for development)
3. Once your cluster is created, click "Connect" > "Connect your application"
4. Copy the connection string - it should look like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/afp_personnel_db?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database credentials

### Option B: Other MongoDB Provider

If you're using another MongoDB provider, make sure you have the connection string in the format:
```
mongodb://<username>:<password>@<host>:<port>/afp_personnel_db
```

## Step 2: Deploy to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)

2. Click "New +" and select "Web Service"

3. Connect your Git repository
   - Select GitHub, GitLab, or Bitbucket
   - Grant Render access to your repository
   - Select the repository containing your application

4. Configure the web service:
   - **Name**: `301st-rribn-management-system` (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (for development)

5. Add environment variables:
   - Click "Advanced" > "Add Environment Variable"
   - Add the following key-value pairs:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB connection string from Step 1
     - `JWT_SECRET`: A secure random string for JWT token signing

6. Click "Create Web Service"

Render will now build and deploy your application. This may take a few minutes for the initial deployment.

## Step 3: Monitor Deployment

1. Once the build completes, Render will provide a URL for your application (e.g., `https://301st-rribn-management-system.onrender.com`)

2. Click on the "Logs" tab to view the deployment logs and troubleshoot any issues

3. Test your application by visiting the provided URL

## Step 4: Configure Your Mobile App

Update the API endpoint in your Flutter mobile app:

1. Open `armed_forces_app/lib/core/constants/app_constants.dart`
2. Update the `productionUrl` to your Render URL:
   ```dart
   static const String productionUrl = 'https://your-render-app-name.onrender.com';
   ```
3. Rebuild your mobile app with this updated URL

## Step 5: Database Seeding (Optional)

If you need to seed your database with initial data:

1. Go to your Render dashboard
2. Select your web service
3. Go to the "Shell" tab
4. Run your seed scripts:
   ```
   npm run seed:personnel
   npm run seed:policies
   ```

## Troubleshooting

### Connection Issues

If your application can't connect to MongoDB:
1. Check your MongoDB connection string in Render environment variables
2. Ensure your MongoDB cluster is allowing connections from Render's IP addresses
3. Check the Render logs for any connection errors

### Build Failures

If your build fails:
1. Check the build logs for errors
2. Make sure all dependencies are correctly listed in package.json
3. Verify that the build and start commands are correct

### Application Errors

If your application deploys but doesn't function correctly:
1. Check the Render logs for runtime errors
2. Verify that all environment variables are set correctly
3. Test your application locally with the same environment variables

## Upgrading Your Plan

The free tier has limitations including:
- Spinning down after periods of inactivity
- Limited bandwidth and compute resources

When you're ready to move to production, consider upgrading to a paid plan for:
- Always-on service
- More resources
- Custom domains
- Improved performance

## Need More Help?

If you encounter issues not covered in this guide, refer to:
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- Contact Render support through their dashboard 