# Netlify Deployment Guide for Costing Automation

This guide will help you deploy your Costing Automation project on Netlify.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Environment Variables**: Have your production environment variables ready

## Deployment Options

### Option 1: Deploy Frontend Only (Recommended for Static Sites)

Since your project has both frontend and backend components, you have two deployment strategies:

#### For Frontend-Only Deployment:

1. **Connect to GitHub**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Select the branch (usually `main` or `master`)

2. **Build Settings**:
   - Build command: `npm run build:netlify`
   - Publish directory: `public`
   - Node version: 18

3. **Environment Variables**:
   - Go to Site settings > Environment variables
   - Add your production environment variables:
     ```
     NODE_ENV=production
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy your site

### Option 2: Full-Stack Deployment (Frontend + Backend)

For a full-stack deployment, you'll need to deploy your backend separately:

#### Backend Deployment (Heroku/Railway/Vercel):
1. Deploy your Express.js backend to a service like:
   - **Heroku**: Free tier available
   - **Railway**: Modern alternative to Heroku
   - **Vercel**: Good for serverless functions
   - **Render**: Free tier available

2. Update the API proxy in `netlify.toml`:
   ```toml
   [[redirects]]
   from = "/api/*"
   to = "https://your-backend-url.herokuapp.com/api/:splat"
   status = 200
   force = true
   ```

#### Frontend Deployment (Netlify):
1. Follow the frontend-only deployment steps above
2. Update the `_redirects` file in your `public` folder:
   ```
   /api/*    https://your-backend-url.herokuapp.com/api/:splat    200
   ```

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Deploy on Netlify

1. **Go to Netlify Dashboard**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Create New Site**
   - Click "New site from Git"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select your `Costing-Automation` repository

3. **Configure Build Settings**
   - Branch to deploy: `main` (or your default branch)
   - Build command: `npm run build:netlify`
   - Publish directory: `public`

4. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following variables:
     ```
     NODE_ENV=production
     SUPABASE_URL=your_actual_supabase_url
     SUPABASE_ANON_KEY=your_actual_supabase_anon_key
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete
   - Your site will be available at a Netlify URL like `https://your-site-name.netlify.app`

### 3. Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## Important Notes

### For Backend API Calls

Since Netlify is primarily for static sites, your Express.js backend won't run on Netlify. You have several options:

1. **Deploy Backend Separately**: Use Heroku, Railway, or Render for your backend
2. **Use Netlify Functions**: Convert your API routes to serverless functions
3. **External API**: Use an external service for your database operations

### Environment Variables

Make sure to set these in your Netlify dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Any other environment variables your app needs

### CORS Configuration

If you deploy your backend separately, make sure to update CORS settings in your Express app to allow your Netlify domain.

## Troubleshooting

### Build Failures
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Issues
- If using external backend, ensure CORS is configured
- Check that environment variables are set correctly
- Verify API endpoints are accessible

### Static File Issues
- Ensure all static files are in the `public` directory
- Check that file paths in HTML are correct
- Verify that `_redirects` file is in the `public` directory

## Next Steps

1. **Test Your Deployment**: Visit your Netlify URL and test all functionality
2. **Set Up Continuous Deployment**: Every push to your main branch will trigger a new deployment
3. **Monitor Performance**: Use Netlify's analytics to monitor your site
4. **Set Up Custom Domain**: Configure your own domain name

## Support

If you encounter issues:
1. Check Netlify's build logs
2. Verify your environment variables
3. Test your API endpoints separately
4. Review the Netlify documentation

Your site should now be live and accessible via the Netlify URL!
