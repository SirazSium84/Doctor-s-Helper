# 🚀 MCP Server Deployment Guide

This guide shows you how to deploy your Healthcare MCP Server online using various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- A Supabase project with your healthcare database
- Environment variables configured
- Git repository set up

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Railway** offers the simplest deployment with a generous free tier.

#### Step 1: Prepare Your Repository
```bash
# Ensure these files are in your ai-assited-healthcare-mcp directory:
# - railway.json ✅ (already created)
# - Procfile ✅ (already created) 
# - requirements.txt ✅ (already created)
# - main.py ✅ (with health check endpoint)
```

#### Step 2: Deploy to Railway
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Create new project** → "Deploy from GitHub repo"
4. **Select your repository** and the `ai-assited-healthcare-mcp` directory
5. **Add environment variables** in Railway dashboard:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MCP_SERVER_NAME=healthcare-dashboard
   MCP_SERVER_VERSION=1.0.0
   MCP_PORT=8000
   MCP_HOST=0.0.0.0
   ```
6. **Deploy** - Railway will automatically build and deploy your app

#### Step 3: Get Your URL
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Your MCP server will be available at: `https://your-app-name.railway.app/mcp/`

### Option 2: Render

**Render** offers free hosting with automatic deployments.

#### Step 1: Create render.yaml
```yaml
services:
  - type: web
    name: healthcare-mcp-server
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    envVars:
      - key: SUPABASE_URL
        value: your_supabase_url
      - key: SUPABASE_KEY
        value: your_supabase_anon_key
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: your_service_role_key
      - key: MCP_PORT
        value: 8000
      - key: MCP_HOST
        value: 0.0.0.0
```

#### Step 2: Deploy
1. Sign up at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Select your repository and branch
5. Render will auto-detect Python and deploy

### Option 3: Heroku

**Heroku** is a classic choice for Python apps.

#### Step 1: Install Heroku CLI
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

#### Step 2: Create Heroku App
```bash
cd ai-assited-healthcare-mcp

# Create Heroku app
heroku create your-healthcare-mcp-app

# Add environment variables
heroku config:set SUPABASE_URL=your_supabase_url
heroku config:set SUPABASE_KEY=your_supabase_anon_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
heroku config:set MCP_PORT=8000
heroku config:set MCP_HOST=0.0.0.0

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option 4: DigitalOcean App Platform

**DigitalOcean** offers reliable hosting with good performance.

#### Step 1: Prepare for DigitalOcean
Create a `do-app.yaml` file:
```yaml
name: healthcare-mcp-server
services:
  - name: mcp-server
    source_dir: /ai-assited-healthcare-mcp
    github:
      repo: your-username/your-repo
      branch: main
    run_command: python main.py
    environment_slug: python
    envs:
      - key: SUPABASE_URL
        value: your_supabase_url
      - key: SUPABASE_KEY
        value: your_supabase_anon_key
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: your_service_role_key
```

#### Step 2: Deploy
1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Go to App Platform
3. Create new app from GitHub
4. Select your repository
5. Configure environment variables
6. Deploy

### Option 5: Google Cloud Run

**Google Cloud Run** offers serverless deployment with pay-per-use pricing.

#### Step 1: Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

#### Step 2: Deploy to Cloud Run
```bash
# Install Google Cloud CLI
# Follow: https://cloud.google.com/sdk/docs/install

# Set project
gcloud config set project your-project-id

# Build and deploy
gcloud run deploy healthcare-mcp-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your_supabase_url,SUPABASE_KEY=your_supabase_anon_key
```

## 🔧 Environment Variables

All deployments require these environment variables:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (with defaults)
MCP_SERVER_NAME=healthcare-dashboard
MCP_SERVER_VERSION=1.0.0
MCP_PORT=8000
MCP_HOST=0.0.0.0
```

## 🧪 Testing Your Deployment

After deployment, test your MCP server:

### 1. Health Check
```bash
curl https://your-app-url.railway.app/health
# Should return: {"status": "healthy", "server": "healthcare-dashboard", "version": "1.0.0"}
```

### 2. MCP Tools Test
```bash
curl -X POST https://your-app-url.railway.app/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

### 3. Update Frontend Configuration
Update your Next.js app's environment variables:
```bash
# .env.local
MCP_SERVER_URL=https://your-app-url.railway.app
```

## 📊 Available MCP Tools

Your deployed server will provide these 20+ tools:

### Assessment Tools
- `get_patient_ptsd_scores` - PTSD assessment analysis
- `get_patient_phq_scores` - Depression assessment analysis
- `get_patient_gad_scores` - Anxiety assessment analysis
- `get_patient_who_scores` - Wellbeing assessment analysis
- `get_patient_ders_scores` - Emotion regulation analysis
- `get_all_patient_assessments` - Comprehensive assessment retrieval
- `list_all_patients` - Patient directory
- `get_assessment_summary_stats` - Population statistics

### Motivation Analysis
- `get_motivation_themes` - Extract therapeutic motivation themes

### Analytics Tools
- `analyze_patient_progress` - Progress tracking over time
- `calculate_composite_risk_score` - Multi-domain risk assessment
- `compare_patient_to_population` - Statistical comparisons
- `identify_patients_needing_attention` - High-risk patient identification

### Substance Use Tools
- `get_patient_substance_history` - Substance use profiles
- `analyze_substance_patterns_across_patients` - Population analysis
- `get_high_risk_substance_users` - High-risk substance users
- `compare_substance_use_by_assessment_scores` - Correlation analysis
- `get_substance_use_timeline` - Historical tracking

### Resource Tools
- Patient-specific resource recommendations
- Assessment-based intervention suggestions

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive keys to Git
2. **CORS**: Configure CORS if needed for your frontend
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Monitoring**: Set up logging and monitoring for your deployment

## 🚨 Troubleshooting

### Common Issues:

1. **Port Issues**: Ensure your platform uses the correct port (8000)
2. **Environment Variables**: Double-check all required variables are set
3. **Dependencies**: Ensure all packages are in requirements.txt
4. **Health Check**: Verify the /health endpoint works

### Debug Commands:
```bash
# Check server logs
railway logs  # or platform-specific log command

# Test local deployment
python main.py

# Verify environment variables
echo $SUPABASE_URL
```

## 📈 Scaling Considerations

- **Railway**: Auto-scales based on traffic
- **Render**: Free tier with paid scaling options
- **Heroku**: Dyno-based scaling
- **DigitalOcean**: App Platform auto-scaling
- **Google Cloud Run**: Serverless auto-scaling

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Railway | $5/month credit | Pay-as-you-use |
| Render | Free web services | $7/month+ |
| Heroku | Discontinued | $7/month+ |
| DigitalOcean | $5/month credit | $5/month+ |
| Google Cloud Run | Generous free tier | Pay-per-use |

**Recommendation**: Start with Railway for simplicity, then migrate to Google Cloud Run for cost optimization at scale.

---

Your MCP server is now ready for online deployment! 🚀