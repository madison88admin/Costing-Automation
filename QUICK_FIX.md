# 🚨 QUICK FIX: Netlify 500 Error

## The Problem
Your Netlify functions are crashing because **environment variables are missing**.

## The Solution (3 Steps)

### 1️⃣ Get Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Click your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 2️⃣ Add to Netlify
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these two variables:
   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_ANON_KEY = eyJxxx...
   ```

### 3️⃣ Redeploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 1-2 minutes
4. Test your site!

## ✅ Done!
Your beanie and ballcaps save functions should now work on Netlify.

---

**Still having issues?** See [NETLIFY_FIX_GUIDE.md](./NETLIFY_FIX_GUIDE.md) for detailed troubleshooting.
