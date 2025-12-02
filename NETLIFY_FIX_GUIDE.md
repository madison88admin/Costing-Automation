# Netlify Function Error Fix Guide

## Problem
The Netlify functions are returning 500 errors because the **environment variables are not configured in Netlify**.

When you see these errors:
- `POST https://costingautomation.netlify.app/.netlify/functions/beanie-data-save 500 (Internal Server Error)`
- `Error saving to database: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This means Netlify is returning an HTML error page instead of JSON, which happens when the function crashes due to missing environment variables.

## Solution

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### Step 2: Add Environment Variables to Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your **Costing-Automation** site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** and add these two variables:

   **Variable 1:**
   - Key: `SUPABASE_URL`
   - Value: Your Supabase Project URL (e.g., `https://icavnpspgmcrrqmsprze.supabase.co`)

   **Variable 2:**
   - Key: `SUPABASE_ANON_KEY`
   - Value: Your Supabase anon/public key (the long string)

5. Click **Save**

### Step 3: Redeploy Your Site

After adding the environment variables, you need to trigger a new deployment:

**Option A: Trigger from Netlify Dashboard**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

**Option B: Push a new commit to GitHub**
```bash
git add .
git commit -m "Fix: Add environment variables documentation"
git push
```

### Step 4: Verify the Fix

1. Wait for the deployment to complete (usually 1-2 minutes)
2. Go to your site: https://costingautomation.netlify.app
3. Try to save beanie or ballcaps data
4. Check the browser console (F12) - you should see successful responses

### Step 5: Check Function Logs (If Still Having Issues)

If you still see errors:

1. Go to Netlify dashboard → **Functions** tab
2. Click on `beanie-data-save` or `ballcaps-data-save`
3. Check the **Function log** for detailed error messages
4. Look for these specific messages:
   - ✅ Good: `Environment check: SUPABASE_URL: Set, SUPABASE_ANON_KEY: Set`
   - ❌ Bad: `Supabase configuration missing`

## Common Issues

### Issue 1: Variables Not Taking Effect
**Solution:** Make sure you triggered a new deployment after adding the variables. Environment variables are only loaded during build time.

### Issue 2: Wrong Variable Names
**Solution:** The variable names must be EXACTLY:
- `SUPABASE_URL` (not `SUPABASE_API_URL` or anything else)
- `SUPABASE_ANON_KEY` (not `SUPABASE_KEY` or `SUPABASE_PUBLIC_KEY`)

### Issue 3: Still Getting HTML Errors
**Solution:** 
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check that the deployment completed successfully

## Testing Locally

To test locally with the same setup:

1. Create a `.env` file in the `netlify/functions` directory:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. Run the local development server:
```bash
npm run dev
```

3. Test the save functionality

## Code Changes Made

I've updated the `apiCall` function in `index.html` to:
1. Better detect when Netlify returns HTML instead of JSON
2. Provide clearer error messages
3. Log more debugging information to help diagnose issues

The error messages will now be more helpful and point you to check:
- Netlify function logs
- Environment variable configuration
- Supabase connection

## Need More Help?

If you're still having issues after following these steps:

1. Check the Netlify function logs (as described in Step 5)
2. Verify your Supabase credentials are correct
3. Make sure your Supabase database has the `databank` table created
4. Check that your Supabase project is not paused or suspended

## Summary

The fix is simple:
1. ✅ Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Netlify environment variables
2. ✅ Trigger a new deployment
3. ✅ Test the save functionality

That's it! The code is already set up correctly - it just needs the environment variables to connect to Supabase.
