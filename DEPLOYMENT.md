# HealthAI Deployment Guide

This guide covers deploying HealthAI to production on Render (backend) and Vercel (frontend).

## Prerequisites

- MongoDB Atlas account (free tier available)
- Render account (render.com)
- Vercel account (vercel.com)
- GitHub account with repository access
- Environment variables ready (see `.env.example`)

## Part 1: MongoDB Atlas Setup

### 1. Create MongoDB Cluster

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Create database user with username and password
4. Add IP whitelist (use 0.0.0.0/0 for development, restrict in production)
5. Copy connection string: `mongodb+srv://user:password@cluster.mongodb.net/healthai`

### 2. Create Database

```bash
# The database will be created automatically when the backend first connects
# But you can pre-create it by connecting with MongoDB Compass
```

## Part 2: Render Backend Deployment

### 1. Push Code to GitHub

```bash
cd /vercel/share/v0-project
git add .
git commit -m "Initial HealthAI commit"
git push origin main
```

### 2. Create Backend Service on Render

1. Login to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `healthai-backend`
   - **Environment**: `Python 3.11`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python run.py`
   - **Region**: Choose closest to users

### 3. Add Environment Variables

In Render service settings, add:

```env
FLASK_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/healthai
JWT_SECRET=<generate-random-32-char-key>
ENCRYPTION_KEY=<generate-random-32-byte-key>
BREVO_SMTP_USER=your-brevo-email@example.com
BREVO_SMTP_PASSWORD=your-brevo-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
OPENAI_API_KEY=your-openai-key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
PORT=5000
```

### 4. Deploy

1. Render will automatically deploy when code is pushed
2. Monitor logs in Render dashboard
3. Once deployed, note your backend URL: `https://healthai-backend.onrender.com`

### 5. Initialize Database (Run Once)

```bash
# Execute init_db.py in Render shell or via SSH
python backend/init_db.py
```

## Part 3: Vercel Frontend Deployment

### 1. Configure Frontend

Update `.env.production`:

```env
REACT_APP_API_BASE_URL=https://healthai-backend.onrender.com
```

### 2. Deploy to Vercel

Option A: Via Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel
```

Option B: Via Vercel Dashboard
1. Login to [Vercel](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3. Set Environment Variables in Vercel

In Project Settings → Environment Variables:

```env
REACT_APP_API_BASE_URL=https://healthai-backend.onrender.com
```

### 4. Deploy

1. Vercel automatically deploys on Git push
2. Access at `https://your-project.vercel.app`

## Part 4: Post-Deployment Setup

### 1. Configure CORS

Backend already configured in `app/__init__.py`, but verify:

```python
CORS_ORIGIN = os.getenv('CORS_ORIGIN')  # Must match Vercel URL
```

### 2. Test the Application

```bash
# Test backend health
curl https://healthai-backend.onrender.com/health

# Test login
curl -X POST https://healthai-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@centralmedical.in","password":"Password@123"}'
```

### 3. Initialize Sample Data

Use the admin panel or direct API call:

```bash
# Via backend shell in Render
python backend/init_db.py
```

### 4. Set Up Notifications (Optional)

#### Brevo Email Setup

1. Create account at [Brevo](https://www.brevo.com)
2. Get SMTP credentials
3. Add to environment variables
4. Test email sending

#### Twilio SMS Setup

1. Create account at [Twilio](https://www.twilio.com)
2. Get Account SID and Auth Token
3. Verify phone numbers
4. Add to environment variables
5. Test SMS sending

## Production Checklist

- [ ] MongoDB Atlas cluster running
- [ ] Render backend deployed and healthy
- [ ] Vercel frontend deployed and accessible
- [ ] Environment variables configured (all services)
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS properly configured
- [ ] Database initialized with sample data
- [ ] Email/SMS notifications tested
- [ ] SSL certificates valid
- [ ] Backups configured (MongoDB Atlas)
- [ ] Error logging configured
- [ ] Performance monitored

## Monitoring & Maintenance

### Logs

- **Backend**: Render Dashboard → Service Logs
- **Frontend**: Vercel Dashboard → Deployment Logs
- **Database**: MongoDB Atlas → Metrics

### Scaling

- **Backend**: Render → Auto-scaling settings
- **Frontend**: Vercel → Built-in auto-scaling
- **Database**: MongoDB Atlas → Cluster tier adjustment

### Backups

```bash
# MongoDB Atlas automatic backups (free tier: 7-day retention)
# Configure in MongoDB Atlas → Backup

# Manual backup (if needed)
mongodump --uri "mongodb+srv://..." --out ./backup
```

### Updates & Maintenance

1. Update dependencies regularly
2. Monitor security advisories
3. Keep MongoDB and Python updated
4. Regular security audits

## Troubleshooting

### Backend Issues

```bash
# Check backend status
curl https://healthai-backend.onrender.com/health

# View logs in Render dashboard
# Look for connection errors, missing env vars
```

### Frontend Issues

```bash
# Check API connectivity
# Open browser DevTools → Network tab
# Verify REACT_APP_API_BASE_URL is correct

# Check CORS errors
# Backend CORS_ORIGIN must match frontend URL
```

### Database Issues

```bash
# Test MongoDB connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/healthai"

# Check network access
# Verify IP whitelist in MongoDB Atlas
```

## Security Hardening

1. **Database**:
   - Use strong passwords
   - Restrict IP whitelist
   - Enable network encryption
   - Regular backups

2. **Backend**:
   - Rotate JWT_SECRET regularly
   - Update dependencies
   - Use HTTPS only
   - Rate limiting (to be implemented)

3. **Frontend**:
   - HTTPS enforced
   - CSP headers
   - Dependency updates
   - No sensitive data in localStorage

## Disaster Recovery

1. **Database Recovery**: MongoDB Atlas automated backups
2. **Code Recovery**: Git history on GitHub
3. **Secrets Recovery**: Store in secure vault (e.g., 1Password, LastPass)
4. **RTO/RPO**: < 1 hour (can be improved with redundancy)

## Cost Optimization

- **MongoDB**: Free tier (5GB) or $57/month for dedicated
- **Render**: Free tier with sleep, $7/month for always-on
- **Vercel**: Free tier with generous limits, $20+/month for pro
- **Estimated Monthly**: $0-50 for small production deployment

## Support & Help

- GitHub Issues: Report bugs
- Render Support: Infrastructure issues
- Vercel Support: Frontend deployment issues
- MongoDB Support: Database issues

---

For more information, see [README.md](README.md)
