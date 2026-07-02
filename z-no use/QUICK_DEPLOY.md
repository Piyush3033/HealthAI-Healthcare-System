# HealthAI Quick Deployment Guide

## Prerequisites
- GitHub account with repository
- MongoDB Atlas account (free tier available)
- Render account (free tier available)
- Vercel account (free tier available)

---

## Step 1: Set Up MongoDB Atlas (5 minutes)

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create free cluster
3. Create database user:
   - Username: `healthai_admin`
   - Password: `<generate-strong-password>`
4. Get connection string:
   - Click "Connect" → "Drivers" → copy MongoDB URI
   - Format: `mongodb+srv://healthai_admin:<password>@cluster.mongodb.net/healthai?retryWrites=true&w=majority`
5. Whitelist IP: Add `0.0.0.0/0` (or Render IP range)

**Save**: Connection string for backend

---

## Step 2: Deploy Backend to Render (10 minutes)

### 2a. Connect GitHub Repository
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Select repository: `your-repo`
5. Branch: `main`

### 2b. Configure Service
- **Name**: `healthai-backend`
- **Region**: Choose closest region
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn --bind 0.0.0.0:5000 --workers 4 run:app`

### 2c. Set Environment Variables
Click "Advanced" → "Add Environment Variable" for each:

```
FLASK_ENV=production
MONGODB_URI=mongodb+srv://healthai_admin:<password>@cluster.mongodb.net/healthai?retryWrites=true&w=majority
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_hex(32))">
ENCRYPTION_KEY=<run: python -c "import secrets; print(secrets.token_hex(16))">
BREVO_SMTP_USER=your-brevo-email@example.com
BREVO_SMTP_PASSWORD=<from-brevo-account>
BREVO_SENDER_EMAIL=noreply@healthai.com
TWILIO_ACCOUNT_SID=<from-twilio>
TWILIO_AUTH_TOKEN=<from-twilio>
TWILIO_PHONE_NUMBER=+1234567890
CORS_ORIGIN=https://healthai-frontend.vercel.app
PORT=5000
```

### 2d. Deploy
1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. Copy service URL: `https://healthai-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (10 minutes)

### 3a. Connect GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import Git repository
4. Select `frontend` folder

### 3b. Configure Build
- **Framework**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 3c. Set Environment Variables
```
REACT_APP_API_BASE_URL=https://healthai-backend.onrender.com
REACT_APP_API_TIMEOUT=30000
```

### 3d. Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Copy deployment URL: `https://healthai-frontend.vercel.app`

---

## Step 4: Update CORS (1 minute)

Go back to Render dashboard:
1. Select `healthai-backend` service
2. Go to "Environment"
3. Update `CORS_ORIGIN` to: `https://healthai-frontend.vercel.app`
4. Service redeploys automatically

---

## Step 5: Verify Deployment (5 minutes)

### Test Backend Health
```bash
curl https://healthai-backend.onrender.com/health
# Should return: {"status":"healthy","service":"HealthAI Backend"}
```

### Test Frontend
1. Open `https://healthai-frontend.vercel.app`
2. You should see the login page
3. Test login with default credentials (from README)

### Test API Connection
1. Login successfully (verifies backend connection)
2. Navigate to Patients page
3. Should load patient list from backend

---

## Environment Variables Reference

### Backend (Render)
```
FLASK_ENV=production
MONGODB_URI=mongodb+srv://healthai_admin:PASSWORD@cluster.mongodb.net/healthai
JWT_SECRET=<32-char-random>
ENCRYPTION_KEY=<32-byte-hex>
BREVO_SMTP_USER=<email>
BREVO_SMTP_PASSWORD=<password>
BREVO_SENDER_EMAIL=noreply@healthai.com
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1234567890
CORS_ORIGIN=https://healthai-frontend.vercel.app
PORT=5000
```

### Frontend (Vercel)
```
REACT_APP_API_BASE_URL=https://healthai-backend.onrender.com
REACT_APP_API_TIMEOUT=30000
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend deployment fails | Check requirements.txt is in root of backend folder |
| Frontend build fails | Run `npm install` locally, push to trigger rebuild |
| CORS errors | Update CORS_ORIGIN in Render to match frontend URL |
| API calls timeout | Increase REACT_APP_API_TIMEOUT, check backend health |
| Database connection failed | Verify MongoDB URI, whitelist Render IP |
| Icons not showing | Run `npm install lucide-react` in frontend folder |

---

## Monitoring

### Backend (Render)
- **Logs**: Render dashboard → Logs tab
- **Health**: Visit `/health` endpoint
- **Metrics**: Render dashboard → Metrics tab

### Frontend (Vercel)
- **Logs**: Vercel dashboard → Deployments → View logs
- **Analytics**: Vercel dashboard → Analytics tab

---

## Next Steps

1. Configure custom domain (optional)
2. Set up email notifications in Render
3. Configure Vercel analytics
4. Set up GitHub Actions for CI/CD
5. Configure database backups
6. Set up error tracking (Sentry)

---

## Support

For issues:
1. Check DEPLOYMENT_CHECKLIST.md for detailed info
2. Review logs in Render/Vercel dashboards
3. Verify all environment variables are set
4. Test locally with docker-compose first
5. Check API_DOCS.md for API reference

---

**Estimated Total Time**: 30-40 minutes
**All services**: Free tier compatible
